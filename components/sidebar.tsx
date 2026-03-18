import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Folder, Plus, Settings as SettingsIcon, Trash2, Edit2 } from 'lucide-react';
import SettingsModal from './settings-modal';

export default function Sidebar() {
  const { folders, selectedFolderId, setSelectedFolder, createFolder, deleteFolder } = useAppStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="w-64 h-full bg-[#f4f4f4] dark:bg-[#121212] flex flex-col py-4 px-2">
      <div className="px-4 pb-6 flex items-center justify-between">
        <h1 className="font-bold text-2xl tracking-tight text-zinc-900 dark:text-zinc-100">Jareth</h1>
        <button 
          onClick={() => setIsCreating(true)}
          className="p-2 bg-brat text-black hover:bg-[#7add00] rounded-full transition-colors shadow-sm"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        <button
          onClick={() => setSelectedFolder(null)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all ${
            selectedFolderId === null 
              ? 'bg-zinc-200 dark:bg-zinc-800 font-bold text-zinc-900 dark:text-zinc-100' 
              : 'hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 font-medium'
          }`}
        >
          <Folder size={18} />
          All Meetings
        </button>

        {isCreating && (
          <form onSubmit={handleCreateFolder} className="px-2 py-2 mb-1">
            <input
              autoFocus
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => setIsCreating(false)}
              placeholder="Folder name..."
              className="w-full bg-white dark:bg-zinc-900 border-none rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brat shadow-sm"
            />
          </form>
        )}

        {folders.map(folder => (
          <div key={folder.id} className="group flex items-center">
            <button
              onClick={() => setSelectedFolder(folder.id)}
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all ${
                selectedFolderId === folder.id
                  ? 'bg-zinc-200 dark:bg-zinc-800 font-bold text-zinc-900 dark:text-zinc-100' 
                  : 'hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 font-medium'
              }`}
            >
              <Folder size={18} />
              <span className="truncate">{folder.name}</span>
            </button>
            <button 
              onClick={() => deleteFolder(folder.id)}
              className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-500 transition-opacity"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 mt-auto">
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all w-full"
        >
          <SettingsIcon size={18} />
          Settings
        </button>
      </div>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}
