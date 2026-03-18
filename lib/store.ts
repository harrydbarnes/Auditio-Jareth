import { create } from 'zustand';
import { db, Folder, Meeting, Settings } from './db';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  folders: Folder[];
  meetings: Meeting[];
  settings: Settings | null;
  selectedFolderId: string | null;
  selectedMeetingId: string | null;
  isRecording: boolean;
  recordingMeetingId: string | null;
  recordingSource: 'mic' | 'system' | 'both';

  init: () => Promise<void>;
  setSelectedFolder: (id: string | null) => void;
  setSelectedMeeting: (id: string | null) => void;
  
  createFolder: (name: string) => Promise<void>;
  updateFolder: (folder: Folder) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  createMeeting: (folderId: string, title: string) => Promise<string>;
  updateMeeting: (meeting: Meeting) => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;

  updateSettings: (settings: Settings) => Promise<void>;

  startRecording: (meetingId: string, source?: 'mic' | 'system' | 'both') => void;
  stopRecording: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  folders: [],
  meetings: [],
  settings: null,
  selectedFolderId: null,
  selectedMeetingId: null,
  isRecording: false,
  recordingMeetingId: null,
  recordingSource: 'both' as 'mic' | 'system' | 'both',

  init: async () => {
    const folders = await db.getFolders();
    const meetings = await db.getMeetings();
    let settings = await db.getSettings();
    
    if (!settings) {
      settings = { 
        id: 'default', 
        summaryStyle: 'default', 
        customPrompts: [],
        summaryModel: 'gemini-3.1-flash-preview',
        liveModel: 'gemini-3.1-flash-preview',
        micId: 'default',
        fontFamily: 'sans'
      };
      await db.updateSettings(settings);
    } else {
      let updated = false;
      if (!settings.summaryModel) { settings.summaryModel = 'gemini-3.1-flash-preview'; updated = true; }
      if (!settings.liveModel) { settings.liveModel = 'gemini-3.1-flash-preview'; updated = true; }
      if (!settings.micId) { settings.micId = 'default'; updated = true; }
      if (!settings.fontFamily) { settings.fontFamily = 'sans'; updated = true; }
      if (updated) await db.updateSettings(settings);
    }

    set({ folders, meetings, settings });
  },

  setSelectedFolder: (id) => set({ selectedFolderId: id, selectedMeetingId: null }),
  setSelectedMeeting: (id) => set({ selectedMeetingId: id }),

  createFolder: async (name) => {
    const newFolder: Folder = { id: uuidv4(), name, createdAt: Date.now() };
    await db.addFolder(newFolder);
    set((state) => ({ folders: [...state.folders, newFolder] }));
  },
  updateFolder: async (folder) => {
    await db.updateFolder(folder);
    set((state) => ({ folders: state.folders.map((f) => (f.id === folder.id ? folder : f)) }));
  },
  deleteFolder: async (id) => {
    await db.deleteFolder(id);
    set((state) => ({ folders: state.folders.filter((f) => f.id !== id) }));
  },

  createMeeting: async (folderId, title) => {
    const newMeeting: Meeting = {
      id: uuidv4(),
      folderId: folderId || '',
      title,
      date: Date.now(),
      duration: 0,
      audioBlob: null,
      transcript: '',
      summary: '',
      summaryStyle: 'default',
      speakers: [],
    };
    await db.addMeeting(newMeeting);
    set((state) => ({ meetings: [...state.meetings, newMeeting], selectedMeetingId: newMeeting.id }));
    return newMeeting.id;
  },
  updateMeeting: async (meeting) => {
    await db.updateMeeting(meeting);
    set((state) => ({ meetings: state.meetings.map((m) => (m.id === meeting.id ? meeting : m)) }));
  },
  deleteMeeting: async (id) => {
    await db.deleteMeeting(id);
    set((state) => ({ meetings: state.meetings.filter((m) => m.id !== id), selectedMeetingId: state.selectedMeetingId === id ? null : state.selectedMeetingId }));
  },

  updateSettings: async (settings) => {
    await db.updateSettings(settings);
    set({ settings });
  },

  startRecording: (meetingId, source = 'both') => set({ isRecording: true, recordingMeetingId: meetingId, recordingSource: source }),
  stopRecording: () => set({ isRecording: false, recordingMeetingId: null }),
}));
