// ===================================================================================
// IMPORTANT: This file is the main entry point for the Electron application.
// It is NOT a standalone script and should not be executed directly by double-clicking.
//
// TO RUN THE APP FROM SOURCE:
// 1. Open a command prompt or terminal in the project's root directory.
// 2. Run the command: npm start
//
// See the README.md file for more detailed instructions.
// ===================================================================================

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const util = require('util'); // For log formatting
const { download } = require('electron-dl');

// --- Start of Logging Implementation ---
// Setup a log file in the user's data directory.
const logFilePath = path.join(app.getPath('userData'), 'app.log');
// Use a write stream to append to the log file.
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Keep the original console functions.
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Override console.log
console.log = function (...args) {
    // Format the message with a timestamp and log level.
    const message = `[${new Date().toISOString()}] [INFO] ${util.format.apply(null, args)}\n`;
    // Write to the log file.
    logStream.write(message);
    // Also write to the original console (useful for development).
    originalConsoleLog.apply(console, args);
};

// Override console.error
console.error = function (...args) {
    // Format the message with a timestamp and log level.
    const message = `[${new Date().toISOString()}] [ERROR] ${util.format.apply(null, args)}\n`;
    // Write to the log file.
    logStream.write(message);
    // Also write to the original console.
    originalConsoleError.apply(console, args);
};

// Catch unhandled exceptions and log them before crashing.
process.on('uncaughtException', (error) => {
    console.error('--- UNCAUGHT EXCEPTION ---');
    console.error(error);
    console.error('--- END UNCAUGHT EXCEPTION ---');
    // The log will be written before the process terminates.
    // It's important to exit after an uncaught exception as the app state is unknown.
    process.exit(1);
});
// --- End of Logging Implementation ---


let win;
let LlamaModel, LlamaContext, LlamaChatSession;
let model;
let context;
let session;

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

function cleanupAIResources() {
    console.log("Cleaning up existing AI resources...");
    session = null;
    context = null;
    model = null;
}

function loadModelAndCreateSession() {
    // Ensure any previous instances are garbage collected before creating new ones.
    cleanupAIResources();

    if (fs.existsSync(modelPath)) {
        try {
            console.log("Loading AI model...");
            model = new LlamaModel({ modelPath });
            console.log("AI model loaded. Creating context and session...");
            // Increased context size to handle larger datalogs and prompts
            context = new LlamaContext({ model, contextSize: 8192 });
            session = new LlamaChatSession({ context });
            console.log("AI context and session created successfully.");
        } catch(e) {
            console.error("Fatal: Failed to load AI model or create a session:", e);
            dialog.showErrorBox('AI Engine Error', `Failed to initialize the AI model. The analysis feature will be disabled. Please restart the app. Error: ${e.message}`);
            // Ensure cleanup on failure
            cleanupAIResources();
        }
    }
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
    loadModelAndCreateSession();
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
        
        // Load the model and create session after download is complete
        loadModelAndCreateSession();

    } catch (e) {
        console.error("Model download failed:", e);
        dialog.showErrorBox("Download Error", `Failed to download the AI model. Please check your internet connection and try again. Error: ${e.message}`);
    }
});


ipcMain.handle('run-inference', async (event, prompt) => {
    if (!model || !context) {
        return JSON.stringify({ error: "AI model is not loaded or the context is not initialized. Please download the model or restart the application." });
    }
    
    if (!session) {
        try {
            console.log("No active session, creating a new one.");
            session = new LlamaChatSession({ context });
        } catch (e) {
            console.error("Failed to create initial session:", e);
            return JSON.stringify({ error: `Failed to create an AI session: ${e.message}. Please restart the application.` });
        }
    }
    
    try {
        const response = await session.prompt(prompt, {
            maxTokens: 4096, // Increased token limit for larger analysis
            temperature: 0.2,
        });

        return response;

    } catch (e) {
        console.error("Inference error:", e);
        console.log("Attempting to recover from inference error...");

        // Invalidate the failed session
        session = null;

        try {
            // Tier 1 Recovery: Try to create a new session with the existing context
            console.log("Resetting AI session...");
            session = new LlamaChatSession({ context });
            console.log("AI session has been successfully reset.");
            return JSON.stringify({ error: `An error occurred during AI analysis: ${e.message}. The AI session was automatically reset. Please try again.` });
        } catch (resetError) {
            // Tier 2 Recovery: If session reset fails, do a full model reload
            console.error("Failed to reset session, attempting full model reload.", resetError);
            loadModelAndCreateSession(); 

            if (model && session) {
                 return JSON.stringify({ error: `A critical error occurred during analysis: ${e.message}. The entire AI engine has been reloaded. Please try your request again.` });
            } else {
                 return JSON.stringify({ error: `A critical error occurred: ${e.message}, and the AI engine could not be recovered. Please restart the application.` });
            }
        }
    }
});