import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { format } from 'date-fns';
import { Download, Trash2, Edit3, FileText, List, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function MeetingDetail() {
  const { meetings, selectedMeetingId, updateMeeting, deleteMeeting, settings } = useAppStore();
  const meeting = meetings.find(m => m.id === selectedMeetingId);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript'>('summary');

  if (!meeting) {
    const today = new Date();
    const meetingsToday = meetings.filter(m => {
      const d = new Date(m.date);
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }).length;

    const hour = today.getHours();
    let greeting = 'Good morning';
    let vibe = 'Ready to crush it?';
    
    if (hour >= 12 && hour < 17) {
      greeting = 'Good afternoon';
      vibe = 'Keep the momentum going.';
    } else if (hour >= 17 && hour < 21) {
      greeting = 'Good evening';
      vibe = 'Wrapping things up?';
    } else if (hour >= 21 || hour < 5) {
      greeting = 'Late night';
      vibe = 'Burning the midnight oil, I see.';
    }

    let meetingContext = '';
    if (meetingsToday === 0) {
      meetingContext = "You haven't had any meetings yet today.";
    } else if (meetingsToday === 1) {
      meetingContext = "You've survived 1 meeting today.";
    } else if (meetingsToday < 4) {
      meetingContext = `You've powered through ${meetingsToday} meetings today.`;
    } else {
      meetingContext = `Wow, ${meetingsToday} meetings today. Take a breath!`;
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f4f4f4] dark:bg-[#121212]">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-brat rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(140,255,0,0.3)]">
            <Sparkles size={32} className="text-black" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {greeting}, Jareth.
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {meetingContext} {vibe}
          </p>
          <div className="pt-8 text-sm text-zinc-500 dark:text-zinc-500">
            Select a meeting from the sidebar or start a new recording.
          </div>
        </div>
      </div>
    );
  }

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      updateMeeting({ ...meeting, title: title.trim() });
      setIsEditingTitle(false);
    }
  };

  const handleExport = () => {
    const content = `# ${meeting.title}\n\nDate: ${format(meeting.date, 'PPP p')}\nDuration: ${Math.floor(meeting.duration / 60)}m ${meeting.duration % 60}s\n\n## Summary\n\n${meeting.summary}\n\n## Transcript\n\n${meeting.transcript}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#1e1e1e] rounded-3xl overflow-hidden">
      <div className="px-8 py-8 border-b border-zinc-200 dark:border-zinc-800/50 flex items-start justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
        <div>
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit}>
              <input
                autoFocus
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                className="text-3xl font-bold bg-transparent border-b-2 border-brat outline-none text-zinc-900 dark:text-zinc-100 w-full"
              />
            </form>
          ) : (
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3 group">
              {meeting.title}
              <button
                onClick={() => {
                  setTitle(meeting.title);
                  setIsEditingTitle(true);
                }}
                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-brat transition-opacity p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Edit3 size={18} />
              </button>
            </h1>
          )}
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-2 flex items-center gap-2">
            <span>{format(meeting.date, 'EEEE, MMMM d, yyyy h:mm a')}</span>
            <span>•</span>
            <span>{Math.floor(meeting.duration / 60)}m {meeting.duration % 60}s</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="p-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
            title="Export as Markdown"
          >
            <Download size={20} />
          </button>
          <button
            onClick={() => deleteMeeting(meeting.id)}
            className="p-3 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-all"
            title="Delete Meeting"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="px-8 py-4 border-b border-zinc-200 dark:border-zinc-800/50 flex gap-4 bg-white dark:bg-[#1e1e1e]">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
            activeTab === 'summary'
              ? 'bg-brat text-black shadow-sm'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          <List size={18} />
          Summary
        </button>
        <button
          onClick={() => setActiveTab('transcript')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
            activeTab === 'transcript'
              ? 'bg-brat text-black shadow-sm'
              : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
          }`}
        >
          <FileText size={18} />
          Transcript
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-[#1e1e1e]">
        {activeTab === 'summary' ? (
          <div className="prose prose-zinc dark:prose-invert max-w-3xl prose-headings:font-bold prose-a:text-brat">
            {meeting.summary ? (
              <ReactMarkdown>{meeting.summary}</ReactMarkdown>
            ) : (
              <p className="text-zinc-500 italic font-medium">No summary available. Generate one after recording.</p>
            )}
          </div>
        ) : (
          <div className="max-w-3xl">
            {meeting.transcript ? (
              <div className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-200 leading-relaxed">
                {meeting.transcript}
              </div>
            ) : (
              <p className="text-zinc-500 italic font-medium">No transcript available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
