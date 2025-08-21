const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  checkModelExists: () => ipcRenderer.invoke('check-model-exists'),
  downloadModel: () => ipcRenderer.invoke('download-model'),
  runInference: (prompt) => ipcRenderer.invoke('run-inference', prompt),
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (_event, progress) => {
      callback(progress);
    });
  },
});
