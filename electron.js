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

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const util = require('util');

// --- Start of Logging Implementation ---
let logStream;
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

function setupLogging() {
    const logFilePath = path.join(app.getPath('userData'), 'app.log');
    logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

    console.log = function (...args) {
        const message = `[${new Date().toISOString()}] [INFO] ${util.format.apply(null, args)}\n`;
        logStream.write(message);
        originalConsoleLog.apply(console, args);
    };

    console.error = function (...args) {
        const message = `[${new Date().toISOString()}] [ERROR] ${util.format.apply(null, args)}\n`;
        logStream.write(message);
        originalConsoleError.apply(console, args);
    };

    process.on('uncaughtException', (error) => {
        console.error('--- UNCAUGHT EXCEPTION ---');
        console.error(error);
        console.error('--- END UNCAUGHT EXCEPTION ---');
        process.exit(1);
    });
}
// --- End of Logging Implementation ---


let win;

// Store AI provider configurations
let aiConfig = {
    geminiApiKey: null,
    localModelPath: null,
    currentProvider: 'cloud' // Start with cloud provider as default
};

function createWindow() {
    win = new BrowserWindow({
        width: 1280,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        show: false // Don't show until ready
    });

    win.loadFile('index.html');

    win.once('ready-to-show', () => {
        win.show();
        console.log('Application window shown successfully');
    });

    win.on('closed', () => {
        win = null;
    });

    win.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

function checkRequiredFiles() {
    const requiredFiles = [
        'index.html',
        'dist/bundle.js',
        'dist/tailwind.css',
        'preload.js'
    ];

    const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, file)));
    
    if (missingFiles.length > 0) {
        const message = `Missing required files: ${missingFiles.join(', ')}\n\nPlease run "npm run build" first.`;
        dialog.showErrorBox('Build Required', message);
        console.error('Missing files:', missingFiles);
        return false;
    }
    return true;
}

async function initializeApp() {
    console.log('Initializing Hondata AI Tuning Assistant...');
    setupLogging();
    
    if (!checkRequiredFiles()) {
        app.quit();
        return;
    }

    createWindow();
    console.log('Application initialized successfully');
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

// --- IPC Handlers for AI Configuration ---

ipcMain.handle('get-ai-config', () => {
    return {
        hasGeminiKey: !!aiConfig.geminiApiKey,
        hasLocalModel: !!aiConfig.localModelPath && fs.existsSync(aiConfig.localModelPath),
        currentProvider: aiConfig.currentProvider
    };
});

ipcMain.handle('set-gemini-key', async (event, apiKey) => {
    if (!apiKey || typeof apiKey !== 'string') {
        return { success: false, error: 'Invalid API key' };
    }
    
    aiConfig.geminiApiKey = apiKey;
    console.log('Gemini API key configured');
    return { success: true };
});

ipcMain.handle('set-ai-provider', async (event, provider) => {
    if (!['cloud', 'local'].includes(provider)) {
        return { success: false, error: 'Invalid provider' };
    }
    
    aiConfig.currentProvider = provider;
    console.log(`AI provider set to: ${provider}`);
    return { success: true };
});

// --- AI Inference Handler ---
ipcMain.handle('run-ai-analysis', async (event, { datalog, engineType, engineSetup, turboSetup }) => {
    console.log(`Running AI analysis with provider: ${aiConfig.currentProvider}`);
    
    try {
        if (aiConfig.currentProvider === 'cloud') {
            if (!aiConfig.geminiApiKey) {
                throw new Error('Gemini API key not configured. Please set it in the AI Settings.');
            }
            return await runCloudAnalysis(datalog, engineType, engineSetup, turboSetup);
        } else {
             throw new Error('Local AI model not available yet. Please use the Cloud AI provider.');
        }
    } catch (error) {
        console.error('AI analysis failed:', error);
        return {
            success: false,
            error: error.message || 'An unknown AI analysis error occurred.'
        };
    }
});

// Cloud-based analysis using Gemini API
async function runCloudAnalysis(datalog, engineType, engineSetup, turboSetup) {
    // Dynamically import the ES Module
    const { GoogleGenAI, Type } = await import('@google/genai');

    const { systemPrompt, userPrompt } = buildAnalysisPrompt(datalog, engineType, engineSetup, turboSetup);

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
    
    try {
        console.log("Running Gemini inference...");
        const ai = new GoogleGenAI({ apiKey: aiConfig.geminiApiKey });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [{ text: userPrompt }] },
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                responseSchema: tuningSuggestionsSchema,
            },
        });

        const suggestions = JSON.parse(response.text);
        return {
            success: true,
            suggestions: suggestions
        };

    } catch (e) {
        console.error("Gemini inference error:", e);
        throw new Error(`Gemini API Error: ${e.message}`);
    }
}


function buildAnalysisPrompt(datalog, engineType, engineSetup, turboSetup) {
    const isBoosted = engineType === 'boosted';
    const engineTypeText = isBoosted ? "Boosted (Forced Induction)" : "Naturally Aspirated";
    const targetAfrWot = isBoosted ? "11.0-11.5" : "12.8-13.2";

    const systemPrompt = `You are an expert engine tuner specializing in Hondata S300 systems. Your task is to analyze the provided CSV datalog and user hardware information, then provide actionable tuning advice.
Your entire response must be a JSON object that conforms to the schema provided.

Key Tuning Objectives:
- Prioritize engine safety above all else.
- Target an idle and light cruise Air-Fuel Ratio (AFR) of approximately 14.7.
- For a ${engineTypeText} engine, target a Wide Open Throttle (WOT) AFR between ${targetAfrWot}.
- Analyze ignition timing for signs of being too aggressive (risk of knock) or too conservative (loss of power).
- Monitor injector duty cycle and flag if it exceeds a safe threshold of 85%.
- Consider the user's hardware setup in all recommendations. For example, larger injectors might explain low duty cycles, or a large turbo might explain boost lag.`;

    const userPrompt = `
        Please analyze the following datalog based on my hardware setup.

        ## User Hardware Information:
        - **Engine Type**: ${engineTypeText}
        - **Engine Details**: ${engineSetup || "Not specified."}
        - **Turbo/Induction Setup**: ${turboSetup || (isBoosted ? "Boosted setup details not provided." : "Naturally Aspirated.")}

        ## Datalog (CSV Content):
        \`\`\`csv
        ${datalog}
        \`\`\`
    `;

    return { systemPrompt, userPrompt };
}


// --- File Operations ---
ipcMain.handle('save-file', async (event, options) => {
    const result = await dialog.showSaveDialog(win, options);
    return result;
});

ipcMain.handle('write-file', async (event, filePath, data) => {
    try {
        fs.writeFileSync(filePath, data);
        return { success: true };
    } catch (error) {
        console.error('File write error:', error);
        return { success: false, error: error.message };
    }
});

// --- App Info ---
ipcMain.handle('get-app-info', () => {
    const logFilePath = path.join(app.getPath('userData'), 'app.log');
    return {
        version: app.getVersion(),
        name: app.getName(),
        userDataPath: app.getPath('userData'),
        logPath: logFilePath
    };
});

console.log('Electron main process loaded successfully');