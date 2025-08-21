const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { download } = require('electron-dl');

let win;
let LlamaModel, LlamaContext, LlamaChatSession;
let model;

const modelName = 'Meta-Llama-3-8B-Instruct.Q4_K_M.gguf';
const modelUrl = `https://huggingface.co/QuantFactory/Meta-Llama-3-8B-Instruct-GGUF/resolve/main/${modelName}`;
const modelPath = path.join(app.getPath('userData'), modelName);


function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'build/icon.ico')
  });

  win.loadFile('index.html');
}

async function initializeApp() {
    try {
        // Dynamically import the ESM 'node-llama-cpp' module
        const llamaModule = await import('node-llama-cpp');
        LlamaModel = llamaModule.LlamaModel;
        LlamaContext = llamaModule.LlamaContext;
        LlamaChatSession = llamaModule.LlamaChatSession;
    } catch (e) {
        console.error('Failed to load node-llama-cpp:', e);
        dialog.showErrorBox('Fatal Error', `Failed to initialize the AI engine. The application cannot start. Error: ${e.message}`);
        app.quit();
        return;
    }

    createWindow();
    
    // Load the model if it exists
    if (fs.existsSync(modelPath)) {
        try {
            model = new LlamaModel({ modelPath });
        } catch(e) {
            console.error("Failed to load model:", e);
        }
    }
}

app.whenReady().then(initializeApp);

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

// --- IPC Handlers for AI Model Management ---

ipcMain.handle('check-model-exists', () => {
    return fs.existsSync(modelPath);
});

ipcMain.handle('download-model', async () => {
    if (!win) return;
    if (!LlamaModel) {
        dialog.showErrorBox("Error", "AI engine is not initialized. Cannot download model.");
        return;
    }
    try {
        await download(win, modelUrl, {
            directory: app.getPath('userData'),
            onProgress: (progress) => {
                win.webContents.send('download-progress', progress);
            },
        });
        
        // Load the model after download is complete
        model = new LlamaModel({ modelPath });

    } catch (e) {
        console.error("Model download failed:", e);
        dialog.showErrorBox("Download Error", `Failed to download the AI model. Please check your internet connection and try again. Error: ${e.message}`);
    }
});


ipcMain.handle('run-inference', async (event, prompt) => {
    if (!model) {
        return JSON.stringify({ error: "AI model is not loaded. Please download the model first." });
    }
     if (!LlamaContext || !LlamaChatSession) {
        return JSON.stringify({ error: "AI engine components are not loaded correctly. Please restart the application." });
    }
    
    try {
        const context = new LlamaContext({ model, contextSize: 4096 });
        const session = new LlamaChatSession({ context });
        
        const response = await session.prompt(prompt, {
            maxTokens: 2048,
            temperature: 0.2,
        });

        return response;

    } catch (e) {
        console.error("Inference error:", e);
        return JSON.stringify({ error: `An error occurred during AI analysis: ${e.message}` });
    }
});