const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    webPreferences: {
      // In a real app, you would use a preload script for security.
      // For this simple example, we are keeping it straightforward.
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'build/icon.ico')
  });

  win.loadFile('index.html');

  // Optional: Open DevTools.
  // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});