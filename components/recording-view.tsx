import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { AudioRecorder } from '@/lib/audio';
import { generateSummary, askLiveQuestion } from '@/lib/ai';
import { Mic, Square, Loader2, Send, Sparkles, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function RecordingView() {
  const { meetings, recordingMeetingId, updateMeeting, stopRecording, settings, recordingSource } = useAppStore();
  const meeting = meetings.find(m => m.id === recordingMeetingId);

  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recorder, setRecorder] = useState<AudioRecorder | null>(null);
  
  const [liveQuestion, setLiveQuestion] = useState('');
  const [liveAnswers, setLiveAnswers] = useState<{ q: string; a: string }[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!meeting) return;
    
    const newRecorder = new AudioRecorder((text) => {
      setTranscript(prev => prev + ' ' + text);
    });
    
    setRecorder(newRecorder);

    newRecorder.start(recordingSource as 'mic' | 'system' | 'both', settings?.micId).catch(err => {
      console.error(err);
      alert('Could not start recording. Please check permissions.');
      stopRecording();
    });

    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      newRecorder.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty to only run once on mount

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  if (!meeting) return null;

  const handleStop = async () => {
    if (!recorder) return;
    
    setIsProcessing(true);
    try {
      const audioBlob = await recorder.stop();
      
      // Get diarized transcript from Gemini
      let finalTranscript = transcript.trim();
      try {
        const { transcribeAudioChunk } = await import('@/lib/ai');
        const diarized = await transcribeAudioChunk(audioBlob);
        if (diarized) {
          finalTranscript = diarized;
        }
      } catch (err) {
        console.error('Failed to get diarized transcript, falling back to live transcript', err);
      }
      
      // Update meeting with final duration and transcript
      const updatedMeeting = {
        ...meeting,
        duration,
        transcript: finalTranscript,
        audioBlob,
      };
      
      await updateMeeting(updatedMeeting);

      // Generate summary
      const summary = await generateSummary(
        updatedMeeting.transcript, 
        settings!
      );

      await updateMeeting({
        ...updatedMeeting,
        summary,
      });

    } catch (error) {
      console.error('Error stopping recording:', error);
    } finally {
      setIsProcessing(false);
      stopRecording();
    }
  };

  const handleAskQuestion = async (type: string, customQ?: string) => {
    if (!transcript.trim() || isAsking) return;
    
    setIsAsking(true);
    const qText = customQ || type;
    
    try {
      const answer = await askLiveQuestion(transcript, type, customQ, settings!);
      setLiveAnswers(prev => [...prev, { q: qText, a: answer }]);
    } catch (error) {
      console.error('Error asking question:', error);
      setLiveAnswers(prev => [...prev, { q: qText, a: 'Sorry, I could not generate an answer.' }]);
    } finally {
      setIsAsking(false);
      setLiveQuestion('');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#1e1e1e] rounded-3xl overflow-hidden relative">
      <div className="px-8 py-6 border-b border-zinc-200 dark:border-zinc-800/50 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{meeting.title}</h2>
          <span className="font-mono text-lg font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-200/50 dark:bg-zinc-800/50 px-3 py-1 rounded-lg">
            {Math.floor(duration / 60).toString().padStart(2, '0')}:{(duration % 60).toString().padStart(2, '0')}
          </span>
        </div>
        
        <button
          onClick={handleStop}
          disabled={isProcessing}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
        >
          {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Square size={20} fill="currentColor" />}
          {isProcessing ? 'Processing...' : 'Stop Recording'}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Transcript Area */}
        <div className="flex-1 p-8 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-[#1e1e1e]">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Mic size={16} /> Live Transcript
          </h3>
          <div className="whitespace-pre-wrap text-xl text-zinc-800 dark:text-zinc-200 leading-relaxed">
            {transcript || <span className="text-zinc-400 italic">Listening...</span>}
            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* AI Assistant Area */}
        <div className="w-[400px] bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800/50 flex items-center gap-3 text-zinc-900 dark:text-zinc-100 font-bold text-lg">
            <div className="w-8 h-8 bg-brat rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(140,255,0,0.3)]">
              <Sparkles size={16} className="text-black" />
            </div>
            Live Assistant
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {liveAnswers.map((item, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-4 py-3 rounded-2xl rounded-tr-sm text-sm inline-block max-w-[85%] font-medium">
                    {item.q}
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-brat/10 dark:bg-brat/5 border border-brat/20 text-zinc-900 dark:text-zinc-100 px-4 py-3 rounded-2xl rounded-tl-sm text-sm prose prose-sm dark:prose-invert max-w-[95%]">
                    <ReactMarkdown>{item.a}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isAsking && (
              <div className="flex items-center gap-3 text-zinc-500 text-sm font-medium bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-2xl w-fit">
                <Loader2 size={16} className="animate-spin text-brat" /> Thinking...
              </div>
            )}
          </div>

          <div className="p-6 border-t border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-[#1e1e1e]">
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => handleAskQuestion('missed')} className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3 py-2 rounded-full text-zinc-600 dark:text-zinc-300 transition-all">What did I miss?</button>
              <button onClick={() => handleAskQuestion('summarize_2m')} className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3 py-2 rounded-full text-zinc-600 dark:text-zinc-300 transition-all">Summarize last 2m</button>
              <button onClick={() => handleAskQuestion('action_items')} className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3 py-2 rounded-full text-zinc-600 dark:text-zinc-300 transition-all">Action items?</button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (liveQuestion.trim()) handleAskQuestion('custom', liveQuestion);
              }}
              className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-full focus-within:ring-2 focus-within:ring-brat transition-all"
            >
              <input
                type="text"
                value={liveQuestion}
                onChange={(e) => setLiveQuestion(e.target.value)}
                placeholder="Ask AI about the meeting..."
                className="flex-1 bg-transparent border-none px-4 py-2 text-sm outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 font-medium"
              />
              <button 
                type="submit"
                disabled={!liveQuestion.trim() || isAsking}
                className="p-2.5 bg-brat hover:bg-[#7add00] text-black rounded-full disabled:opacity-50 transition-all shadow-sm"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
