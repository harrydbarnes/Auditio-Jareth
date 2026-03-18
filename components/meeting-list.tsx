import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { format } from 'date-fns';
import { Mic, FileText, Clock, Monitor, MonitorSpeaker } from 'lucide-react';

export default function MeetingList() {
  const { meetings, selectedFolderId, selectedMeetingId, setSelectedMeeting, createMeeting, startRecording } = useAppStore();
  const [audioSource, setAudioSource] = useState<'mic' | 'system' | 'both'>('both');

  const filteredMeetings = selectedFolderId 
    ? meetings.filter(m => m.folderId === selectedFolderId)
    : meetings.filter(m => !m.folderId);

  const sortedMeetings = [...filteredMeetings].sort((a, b) => b.date - a.date);

  const handleNewRecording = async () => {
    const title = `Meeting ${format(new Date(), 'MMM d, yyyy HH:mm')}`;
    const id = await createMeeting(selectedFolderId || '', title);
    // We need to pass audioSource to startRecording, let's update the store
    startRecording(id, audioSource);
  };

  return (
    <div className="w-80 h-full bg-[#f4f4f4] dark:bg-[#121212] flex flex-col py-4 px-2">
      <div className="px-4 pb-6 flex flex-col gap-4">
        <h2 className="font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-100">
          {selectedFolderId ? 'Folder Meetings' : 'All Meetings'}
        </h2>
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-4 shadow-sm border border-zinc-200 dark:border-zinc-800/50 flex flex-col gap-3">
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Audio Source
          </label>
          <select
            value={audioSource}
            onChange={(e) => setAudioSource(e.target.value as any)}
            className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brat appearance-none font-medium text-zinc-700 dark:text-zinc-300"
          >
            <option value="both">Mic + System</option>
            <option value="mic">Mic Only</option>
            <option value="system">System Only</option>
          </select>
          <button
            onClick={handleNewRecording}
            className="w-full bg-brat text-black hover:bg-[#7add00] font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <Mic size={18} />
            Start Recording
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-2">
        {sortedMeetings.length === 0 ? (
          <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            No meetings found. Start recording!
          </div>
        ) : (
          sortedMeetings.map(meeting => (
            <button
              key={meeting.id}
              onClick={() => setSelectedMeeting(meeting.id)}
              className={`w-full text-left p-4 rounded-2xl transition-all ${
                selectedMeetingId === meeting.id
                  ? 'bg-white dark:bg-[#1e1e1e] shadow-sm border border-zinc-200 dark:border-zinc-800/50'
                  : 'hover:bg-white/50 dark:hover:bg-[#1e1e1e]/50 border border-transparent'
              }`}
            >
              <h3 className={`font-bold truncate mb-1 ${
                selectedMeetingId === meeting.id ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-700 dark:text-zinc-300'
              }`}>
                {meeting.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {format(meeting.date, 'MMM d, h:mm a')}
                </span>
                {meeting.duration > 0 && (
                  <span>{Math.floor(meeting.duration / 60)}m {meeting.duration % 60}s</span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
