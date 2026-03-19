const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  llmRequest: (args) => ipcRenderer.invoke('llm-request', args),
});
