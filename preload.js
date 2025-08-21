const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Model Management
  getInitialModelStatus: () => ipcRenderer.invoke('get-initial-model-status'),
  downloadModel: () => ipcRenderer.invoke('download-model'),
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

  // Google Auth
  googleSignIn: () => ipcRenderer.invoke('google-signin'),
  googleSignOut: () => ipcRenderer.invoke('google-signout'),
  getAuthStatus: () => ipcRenderer.invoke('get-auth-status'),

  // Inference
  runInference: (args) => ipcRenderer.invoke('run-inference', args),
});