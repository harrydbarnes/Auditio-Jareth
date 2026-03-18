'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import Sidebar from '@/components/sidebar';
import MeetingList from '@/components/meeting-list';
import MeetingDetail from '@/components/meeting-detail';
import RecordingView from '@/components/recording-view';

export default function Home() {
  const { init, isRecording, settings } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    init().then(() => setIsInitialized(true));
  }, [init]);

  if (!isInitialized) {
    return <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-500">Loading...</div>;
  }

  const fontClass = {
    sans: 'font-sans',
    serif: 'font-serif',
    slab: 'font-slab'
  }[settings?.fontFamily || 'sans'] || 'font-sans';

  return (
    <div className={`flex h-screen w-full overflow-hidden bg-[#f4f4f4] dark:bg-[#121212] text-zinc-900 dark:text-zinc-100 ${fontClass}`}>
      <Sidebar />
      <MeetingList />
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#1e1e1e] m-2 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800/50">
        {isRecording ? <RecordingView /> : <MeetingDetail />}
      </div>
    </div>
  );
}
