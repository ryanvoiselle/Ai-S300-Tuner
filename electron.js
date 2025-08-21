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

const { app, BrowserWindow, ipcMain, dialog, net } = require('electron');
const path = require('path');
const fs = require('fs');
const util = require('util'); // For log formatting
const { download } = require('electron-dl');
const { OAuth2Client } = require('google-auth-library');
const { GoogleGenAI, Type } = require('@google/genai');

// --- Google OAuth Configuration ---
// IMPORTANT: In a production application, these values should be stored securely
// and not hardcoded. For example, use environment variables or a secure config service.
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com'; // <-- REPLACE THIS
const GOOGLE_CLIENT_SECRET = 'YOUR_GOOGLE_CLIENT_SECRET'; // <-- REPLACE THIS
const REDIRECT_URI = 'http://localhost:5858/callback'; // A local redirect URI

let oauth2Client;
let userProfile = null; // To store user's profile info

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
let LlamaModel;
let model;
let modelLoadError = null; // Store any errors during model loading

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
    model = null;
}

/**
 * A simplified function to load the AI model into memory.
 * This is called on startup and after a successful download.
 */
function loadModel() {
    cleanupAIResources();
    modelLoadError = null; // Reset error on new load attempt

    if (fs.existsSync(modelPath)) {
        try {
            console.log("Loading AI model from path:", modelPath);
            model = new LlamaModel({ modelPath });
            console.log("AI model loaded successfully.");
            return { exists: true, loaded: true };
        } catch(e) {
            console.error("Fatal: Failed to load AI model:", e);
            modelLoadError = e.message;
            cleanupAIResources(); // Ensure partial loads are cleared
            return { exists: true, loaded: false, error: e.message };
        }
    } else {
        console.log("AI model file not found at path:", modelPath);
        return { exists: false, loaded: false };
    }
}


async function initializeApp() {
    oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT_URI);

    try {
        // Dynamically import the ESM 'node-llama-cpp' module
        const llamaModule = await import('node-llama-cpp');
        LlamaModel = llamaModule.LlamaModel;
    } catch (e) {
        console.error('Failed to load node-llama-cpp:', e);
        dialog.showErrorBox('Fatal Error', `Failed to initialize the AI engine. The application cannot start. Error: ${e.message}`);
        app.quit();
        return;
    }

    createWindow();
    
    // Load the model if it exists on startup
    loadModel();
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

ipcMain.handle('get-initial-model-status', () => {
    const exists = fs.existsSync(modelPath);
    const loaded = !!model;
    return { exists, loaded, error: modelLoadError };
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
                if (win && !win.isDestroyed()) {
                    win.webContents.send('download-progress', progress);
                }
            },
        });
        
        const loadStatus = loadModel();
        if (win && !win.isDestroyed()) {
            win.webContents.send('model-load-attempt-complete', loadStatus);
        }

    } catch (e) {
        console.error("Model download failed:", e);
        dialog.showErrorBox("Download Error", `Failed to download the AI model. Please check your internet connection and try again. Error: ${e.message}`);
         if (win && !win.isDestroyed()) {
            win.webContents.send('model-load-attempt-complete', { loaded: false, error: e.message });
        }
    }
});

// --- IPC Handlers for Google Auth ---

ipcMain.handle('google-signin', () => {
  return new Promise((resolve, reject) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // 'offline' gets a refresh token
      scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/generative-language.tuning'],
    });

    const authWindow = new BrowserWindow({
      width: 500,
      height: 600,
      show: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
      parent: win,
      modal: true
    });

    authWindow.loadURL(authUrl);

    const onWillNavigate = async (event, url) => {
      if (url.startsWith(REDIRECT_URI)) {
        event.preventDefault(); // Stop the navigation
        authWindow.close();

        const code = new URL(url).searchParams.get('code');
        try {
          const { tokens } = await oauth2Client.getToken(code);
          oauth2Client.setCredentials(tokens);
          
          // Get user profile
          const profileResponse = await oauth2Client.request({
            url: 'https://www.googleapis.com/oauth2/v3/userinfo'
          });
          userProfile = profileResponse.data;
          
          console.log("Google sign-in successful for:", userProfile.email);
          resolve({
            isSignedIn: true,
            user: { name: userProfile.name, email: userProfile.email, picture: userProfile.picture }
          });
        } catch (error) {
          console.error('Failed to exchange code for tokens:', error);
          reject(error);
        }
      }
    };

    authWindow.webContents.on('will-navigate', onWillNavigate);
    authWindow.on('closed', () => {
        // If the window is closed without getting a code, resolve as not signed in
        if (!userProfile) {
            resolve({ isSignedIn: false });
        }
    });
  });
});


ipcMain.handle('google-signout', async () => {
    if (oauth2Client.credentials.access_token) {
        // This revokes the token. User will have to re-consent next time.
        await oauth2Client.revokeCredentials();
    }
    oauth2Client.setCredentials(null);
    userProfile = null;
    console.log("User signed out.");
    return { isSignedIn: false };
});


ipcMain.handle('get-auth-status', () => {
    if (userProfile) {
        return {
            isSignedIn: true,
            user: { name: userProfile.name, email: userProfile.email, picture: userProfile.picture }
        };
    }
    return { isSignedIn: false };
});

// --- Unified Inference Handler ---

const tuningSuggestionsSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A brief summary of the overall health of the engine tune based on the datalog." },
        fuelAdjustments: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    rpmRange: { type: Type.STRING, description: "e.g., '3000-4500 RPM'" },
                    loadCondition: { type: Type.STRING, description: "e.g., 'Wide Open Throttle' or 'Light Cruise'" },
                    currentAFR: { type: Type.STRING, description: "The observed Air-Fuel Ratio." },
                    targetAFR: { type: Type.STRING, description: "The recommended target Air-Fuel Ratio." },
                    suggestion: { type: Type.STRING, description: "e.g., 'Increase fuel by 3-5%'" },
                    reason: { type: Type.STRING, description: "Why the change is needed, e.g., 'Running lean, risk of knock.'" }
                }
            }
        },
        ignitionAdjustments: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    rpmRange: { type: Type.STRING },
                    loadCondition: { type: Type.STRING },
                    suggestion: { type: Type.STRING },
                    reason: { type: Type.STRING }
                }
            }
        },
        otherObservations: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    observation: { type: Type.STRING, description: "A specific observation, e.g., 'High injector duty cycle.'" },
                    recommendation: { type: Type.STRING, description: "What to do about the observation." }
                }
            }
        }
    }
};


ipcMain.handle('run-inference', async (event, { prompt, provider, systemPrompt, userPrompt }) => {
    if (provider === 'local') {
        if (!model) {
            return JSON.stringify({ error: "Local AI model is not loaded. Please download the model or restart the application if loading failed." });
        }
        
        try {
            console.log("Running local inference...");
            const response = await model.createCompletion({
                prompt: prompt,
                maxTokens: 4096,
                temperature: 0.2,
            });
            return response.choices[0].text;
        } catch (e) {
            console.error("Local inference error:", e);
            return JSON.stringify({ error: `An error occurred during local AI analysis: ${e.message}. Please try again.` });
        }
    } else if (provider === 'gemini') {
        if (!oauth2Client || !oauth2Client.credentials.access_token) {
             return JSON.stringify({ error: "You are not signed in. Please sign in with Google to use the Gemini API." });
        }
        try {
            console.log("Running Gemini inference...");
            const ai = new GoogleGenAI({ authClient: oauth2Client });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: { parts: [{ text: userPrompt }] },
                config: {
                    systemInstruction: systemPrompt,
                    responseMimeType: "application/json",
                    responseSchema: tuningSuggestionsSchema,
                },
            });

            return response.text; // This will be a validated JSON string
        } catch (e) {
            console.error("Gemini inference error:", e);
            return JSON.stringify({ error: `An error occurred with the Gemini API: ${e.message}` });
        }
    } else {
        return JSON.stringify({ error: `Unknown AI provider: ${provider}` });
    }
});