const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getInitialModelStatus: () => ipcRenderer.invoke('get-initial-model-status'),
  downloadModel: () => ipcRenderer.invoke('download-model'),
  runInference: (prompt) => ipcRenderer.invoke('run-inference', prompt),
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (_event, progress) => {
      callback(progress);
    });
  },
  onModelLoadAttemptComplete: (callback) => {
    ipcRenderer.on('model-load-attempt-complete', (_event, status) => {
        callback(status);
    });
  },
});