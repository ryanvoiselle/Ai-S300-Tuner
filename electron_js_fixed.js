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
const logFilePath = path.join(app.getPath('userData'), 'app.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Keep the original console functions.
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Override console.log
console.log = function (...args) {
    const message = `[${new Date().toISOString()}] [INFO] ${util.format.apply(null, args)}\n`;
    logStream.write(message);
    originalConsoleLog.apply(console, args);
};

// Override console.error
console.error = function (...args) {
    const message = `[${new Date().toISOString()}] [ERROR] ${util.format.apply(null, args)}\n`;
    logStream.write(message);
    originalConsoleError.apply(console, args);
};

// Catch unhandled exceptions and log them before crashing.
process.on('uncaughtException', (error) => {
    console.error('--- UNCAUGHT EXCEPTION ---');
    console.error(error);
    console.error('--- END UNCAUGHT EXCEPTION ---');
    process.exit(1);
});
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

    // Load the HTML file
    const indexPath = path.join(__dirname, 'index.html');
    
    if (fs.existsSync(indexPath)) {
        win.loadFile('index.html');
    } else {
        dialog.showErrorBox('Missing Files', 'index.html not found. Please ensure you have built the application with "npm run build".');
        app.quit();
        return;
    }

    // Show window when ready
    win.once('ready-to-show', () => {
        win.show();
        console.log('Application window shown successfully');
    });

    // Handle window closed
    win.on('closed', () => {
        win = null;
    });

    // Open external links in browser
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
    
    // Check for required files
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
            // Cloud-based AI analysis (Gemini)
            if (!aiConfig.geminiApiKey) {
                throw new Error('Gemini API key not configured');
            }
            
            return await runCloudAnalysis(datalog, engineType, engineSetup, turboSetup);
        } else {
            // Local AI analysis
            if (!aiConfig.localModelPath || !fs.existsSync(aiConfig.localModelPath)) {
                throw new Error('Local AI model not found');
            }
            
            return await runLocalAnalysis(datalog, engineType, engineSetup, turboSetup);
        }
    } catch (error) {
        console.error('AI analysis failed:', error);
        return {
            success: false,
            error: error.message || 'AI analysis failed'
        };
    }
});

// Cloud-based analysis using Gemini API
async function runCloudAnalysis(datalog, engineType, engineSetup, turboSetup) {
    const prompt = buildAnalysisPrompt(datalog, engineType, engineSetup, turboSetup);
    
    // Note: In a real implementation, you would make an HTTP request to the Gemini API here
    // For now, we'll simulate the response
    console.log('Simulating cloud AI analysis...');
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
    
    return {
        success: true,
        suggestions: generateMockSuggestions(engineType)
    };
}

// Local AI analysis (placeholder for future implementation)
async function runLocalAnalysis(datalog, engineType, engineSetup, turboSetup) {
    console.log('Simulating local AI analysis...');
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing delay
    
    return {
        success: true,
        suggestions: generateMockSuggestions(engineType)
    };
}

function buildAnalysisPrompt(datalog, engineType, engineSetup, turboSetup) {
    const isBoosted = engineType === 'boosted';
    const engineTypeText = isBoosted ? "Boosted (Forced Induction)" : "Naturally Aspirated";
    
    return `Analyze this ${engineTypeText} engine datalog:
    
Engine Setup: ${engineSetup || 'Not specified'}
Turbo Setup: ${turboSetup || 'Not specified'}

Datalog Data:
${datalog}

Provide tuning recommendations focusing on safety and performance.`;
}

function generateMockSuggestions(engineType) {
    const isBoosted = engineType === 'boosted';
    
    return {
        summary: isBoosted 
            ? "Your boosted setup shows good overall health with minor tuning opportunities for optimization."
            : "Your naturally aspirated setup is running well with some areas for fine-tuning.",
        fuelAdjustments: [
            {
                rpmRange: "3000-4500 RPM",
                loadCondition: "Wide Open Throttle",
                currentAFR: "12.2",
                targetAFR: isBoosted ? "11.5" : "13.0",
                suggestion: isBoosted ? "Slightly richen mixture" : "Lean out slightly for better efficiency",
                reason: isBoosted ? "Current AFR is on the safe side but could use more fuel for power" : "Current AFR is slightly rich for NA application"
            }
        ],
        ignitionAdjustments: [
            {
                rpmRange: "4500-6500 RPM",
                loadCondition: "High Load",
                suggestion: "Add 1-2 degrees timing",
                reason: "Conservative timing leaves power on the table"
            }
        ],
        otherObservations: [
            {
                observation: "Injector duty cycle peaks at 75%",
                recommendation: "Good headroom remaining, no immediate concerns"
            }
        ]
    };
}

// --- File Operations ---
ipcMain.handle('select-file', async (event, options) => {
    const result = await dialog.showOpenDialog(win, options);
    return result;
});

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
    return {
        version: app.getVersion(),
        name: app.getName(),
        userDataPath: app.getPath('userData'),
        logPath: logFilePath
    };
});

console.log('Electron main process loaded successfully');