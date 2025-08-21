import React, { useState, useEffect } from 'react';
import type { AIProvider, AuthStatus } from '../types';

type ModelStatus = 'checking' | 'not_found' | 'downloading' | 'ready' | 'error' | 'load_failed';

// --- Local Model Component ---

const LocalModelManager: React.FC<{
    isModelReady: boolean;
    setIsModelReady: (isReady: boolean) => void;
}> = ({ setIsModelReady }) => {
    const [status, setStatus] = useState<ModelStatus>('checking');
    const [progress, setProgress] = useState(0);
    const [totalSize, setTotalSize] = useState(0);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        window.electronAPI.getInitialModelStatus().then(status => {
            if (status.loaded) {
                setStatus('ready');
                setIsModelReady(true);
            } else if (status.exists) {
                setStatus('load_failed');
                setLoadError(status.error || 'The model file exists but could not be loaded.');
                setIsModelReady(false);
            } else {
                setStatus('not_found');
                setIsModelReady(false);
            }
        });
        
        const onProgress = (prog: { percent: number; totalBytes: number; }) => {
           setProgress(prog.percent);
           if (totalSize <= 0) setTotalSize(prog.totalBytes);
        };

        const onModelLoadComplete = (status: { loaded: boolean; error?: string }) => {
             if (status.loaded) {
                setStatus('ready');
                setIsModelReady(true);
            } else {
                setStatus('error');
                setLoadError(status.error || 'Failed to load the model after downloading.');
                setIsModelReady(false);
            }
        };

        window.electronAPI.onDownloadProgress(onProgress);
        window.electronAPI.onModelLoadAttemptComplete(onModelLoadComplete);

    }, [setIsModelReady, totalSize]);

    const handleDownload = () => {
        setStatus('downloading');
        window.electronAPI.downloadModel();
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${['B', 'KB', 'MB', 'GB', 'TB'][i]}`;
    }
    
    return (
        <div className="mt-4">
            {status === 'checking' && <p className="text-sm text-gray-400">Checking for local model...</p>}
            {status === 'error' && (
                <div>
                    <p className="text-sm text-red-400 mb-2"><strong>Download Failed:</strong> {loadError || 'An error occurred.'}</p>
                    <p className="text-xs text-gray-400">Please restart the app and try again.</p>
                </div>
            )}
             {status === 'load_failed' && (
                <div>
                    <p className="text-sm text-red-400 mb-2"><strong>Model Load Failed:</strong> {loadError}</p>
                    <p className="text-xs text-gray-400">The model file may be corrupted. Try restarting the application.</p>
                </div>
            )}
            {status === 'not_found' && (
                <div>
                    <p className="text-sm text-yellow-400 mb-3">The local AI model (~4.7 GB) is not found. Please download it to enable offline analysis.</p>
                    <button onClick={handleDownload} className="w-full bg-exportBlue-600 hover:bg-exportBlue-700 text-white font-bold py-2 px-4 rounded-lg transition">Download Model</button>
                </div>
            )}
            {status === 'downloading' && (
                <div>
                    <p className="text-sm text-gray-300 mb-2">Downloading... ({formatBytes(totalSize * progress)} / {formatBytes(totalSize)})</p>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div className="bg-exportBlue-600 h-2.5 rounded-full" style={{ width: `${progress * 100}%` }}></div>
                    </div>
                </div>
            )}
            {status === 'ready' && (
                <div className="flex items-center space-x-3 bg-gray-800/50 p-3 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-ecuGreen-400 flex-shrink-0"></div>
                    <span className="font-semibold text-sm">Local Model Ready</span>
                </div>
            )}
        </div>
    );
};

// --- Google Gemini Component ---

const GeminiManager: React.FC<{
    authStatus: AuthStatus;
    setAuthStatus: (status: AuthStatus) => void;
}> = ({ authStatus, setAuthStatus }) => {
    
    useEffect(() => {
        // Check initial auth status when component mounts
        window.electronAPI.getAuthStatus().then(setAuthStatus);
    }, [setAuthStatus]);

    const handleSignIn = async () => {
        try {
            const status = await window.electronAPI.googleSignIn();
            setAuthStatus(status);
        } catch (error) {
            console.error("Google Sign-In failed:", error);
            // Optionally set an error state to show in the UI
        }
    };
    
    const handleSignOut = async () => {
        const status = await window.electronAPI.googleSignOut();
        setAuthStatus(status);
    };

    return (
        <div className="mt-4">
            {!authStatus.isSignedIn ? (
                <>
                    <p className="text-sm text-yellow-400 mb-3">Sign in with your Google account to use the Gemini API for analysis. Requires an internet connection.</p>
                    <button onClick={handleSignIn} className="w-full bg-white text-gray-800 font-bold py-2 px-4 rounded-lg transition flex items-center justify-center space-x-2 hover:bg-gray-200">
                        <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.35 6.48C12.73 13.72 17.94 9.5 24 9.5z"></path><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.91 28.74c-.52-1.57-.82-3.24-.82-5.04s.3-3.47.82-5.04l-8.35-6.48C.73 15.17 0 19.49 0 24s.73 8.83 2.56 12.78l8.35-6.04z"></path><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.82l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.06 0-11.27-4.22-13.19-9.92l-8.35 6.48C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                        <span>Sign in with Google</span>
                    </button>
                </>
            ) : (
                <div className="bg-gray-800/50 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <img src={authStatus.user?.picture} alt="user avatar" className="w-8 h-8 rounded-full" />
                        <div>
                            <p className="font-semibold text-sm">{authStatus.user?.name}</p>
                            <p className="text-xs text-gray-400">{authStatus.user?.email}</p>
                        </div>
                    </div>
                    <button onClick={handleSignOut} className="text-xs text-raceRed-400 hover:underline">Sign Out</button>
                </div>
            )}
        </div>
    )
}


// --- Main AI Manager Component ---

interface AIManagerProps {
    provider: AIProvider;
    onProviderChange: (provider: AIProvider) => void;
    isLocalModelReady: boolean;
    setIsLocalModelReady: (isReady: boolean) => void;
    authStatus: AuthStatus;
    setAuthStatus: (status: AuthStatus) => void;
}

export const AIManager: React.FC<AIManagerProps> = (props) => {
    return (
        <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg shadow-lg h-fit backdrop-blur-sm">
            <h3 className="text-lg font-bold text-gray-200 mb-3">AI Provider</h3>
            
            {/* Provider Selector */}
            <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
                <button
                    onClick={() => props.onProviderChange('local')}
                    className={`w-full py-1.5 px-2 rounded-md transition-colors text-sm font-semibold ${
                        props.provider === 'local' ? 'bg-raceRed-500 text-white' : 'hover:bg-gray-700'
                    }`}
                >
                    Local AI (Offline)
                </button>
                <button
                    onClick={() => props.onProviderChange('gemini')}
                    className={`w-full py-1.5 px-2 rounded-md transition-colors text-sm font-semibold ${
                        props.provider === 'gemini' ? 'bg-raceRed-500 text-white' : 'hover:bg-gray-700'
                    }`}
                >
                    Google Gemini (Online)
                </button>
            </div>

            {/* Conditional UI */}
            {props.provider === 'local' ? (
                <LocalModelManager 
                    isModelReady={props.isLocalModelReady} 
                    setIsModelReady={props.setIsLocalModelReady} 
                />
            ) : (
                <GeminiManager 
                    authStatus={props.authStatus}
                    setAuthStatus={props.setAuthStatus}
                />
            )}
        </div>
    );
};