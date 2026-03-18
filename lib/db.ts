import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface Meeting {
  id: string;
  folderId: string; // empty string for no folder
  title: string;
  date: number;
  duration: number; // in seconds
  audioBlob: Blob | null;
  transcript: string;
  summary: string;
  summaryStyle: string;
  speakers: string[];
}

export interface Settings {
  id: 'default';
  summaryStyle: string;
  customPrompts: { name: string; prompt: string }[];
  openaiKey?: string;
  anthropicKey?: string;
  whisperKey?: string;
  summaryModel: string;
  liveModel: string;
  micId: string;
  fontFamily: string;
}

interface AppDB extends DBSchema {
  folders: {
    key: string;
    value: Folder;
  };
  meetings: {
    key: string;
    value: Meeting;
    indexes: { 'by-folder': string };
  };
  settings: {
    key: 'default';
    value: Settings;
  };
}

let dbPromise: Promise<IDBPDatabase<AppDB>>;

if (typeof window !== 'undefined') {
  dbPromise = openDB<AppDB>('meeting-recorder-db', 1, {
    upgrade(db) {
      db.createObjectStore('folders', { keyPath: 'id' });
      const meetingStore = db.createObjectStore('meetings', { keyPath: 'id' });
      meetingStore.createIndex('by-folder', 'folderId');
      db.createObjectStore('settings', { keyPath: 'id' });
    },
  });
}

export const db = {
  async getFolders() {
    return (await dbPromise).getAll('folders');
  },
  async addFolder(folder: Folder) {
    return (await dbPromise).put('folders', folder);
  },
  async updateFolder(folder: Folder) {
    return (await dbPromise).put('folders', folder);
  },
  async deleteFolder(id: string) {
    return (await dbPromise).delete('folders', id);
  },
  async getMeetings() {
    return (await dbPromise).getAll('meetings');
  },
  async getMeeting(id: string) {
    return (await dbPromise).get('meetings', id);
  },
  async addMeeting(meeting: Meeting) {
    return (await dbPromise).put('meetings', meeting);
  },
  async updateMeeting(meeting: Meeting) {
    return (await dbPromise).put('meetings', meeting);
  },
  async deleteMeeting(id: string) {
    return (await dbPromise).delete('meetings', id);
  },
  async getSettings() {
    const settings = await (await dbPromise).get('settings', 'default');
    if (!settings) {
      const defaultSettings: Settings = {
        id: 'default',
        summaryStyle: 'default',
        customPrompts: [],
        summaryModel: 'gemini-3.1-flash-preview',
        liveModel: 'gemini-3.1-flash-preview',
        micId: 'default',
        fontFamily: 'sans'
      };
      await (await dbPromise).put('settings', defaultSettings);
      return defaultSettings;
    }
    return settings;
  },
  async updateSettings(settings: Settings) {
    return (await dbPromise).put('settings', settings);
  },
};
