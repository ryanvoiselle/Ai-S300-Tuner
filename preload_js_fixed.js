const { contextBridge, ipcRenderer } = require('electron');

// Expose secure API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // AI Configuration
  getAiConfig: () => ipcRenderer.invoke('get-ai-config'),
  setGeminiKey: (apiKey) => ipcRenderer.invoke('set-gemini-key', apiKey),
  setAiProvider: (provider) => ipcRenderer.invoke('set-ai-provider', provider),
  
  // AI Analysis
  runAiAnalysis: (params) => ipcRenderer.invoke('run-ai-analysis', params),
  
  // File Operations
  selectFile: (options) => ipcRenderer.invoke('select-file', options),
  saveFile: (options) => ipcRenderer.invoke('save-file', options),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
  
  // App Info
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Utility
  isElectron: true
});

// Log that preload script loaded successfully
console.log('Preload script loaded successfully');