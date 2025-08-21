
import React, { useState, useEffect, useCallback } from 'react';

type ModelStatus = 'checking' | 'not_found' | 'downloading' | 'ready' | 'error' | 'load_failed';

export const AIModelManager: React.FC<{isModelReady: boolean; setIsModelReady: (isReady: boolean) => void;}> = ({isModelReady, setIsModelReady}) => {
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
           if (totalSize <= 0) {
             setTotalSize(prog.totalBytes);
           }
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
        // The listener will handle success or failure
        window.electronAPI.downloadModel();
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${['B', 'KB', 'MB', 'GB', 'TB'][i]}`;
    }

    return (
        <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg shadow-lg h-fit backdrop-blur-sm">
            <h3 className="text-lg font-bold text-gray-200 mb-2">AI Model</h3>
            {status === 'checking' && <p className="text-gray-400">Checking for local model...</p>}
            {status === 'error' && (
                <div>
                    <p className="text-sm text-red-400 mb-2">
                        <strong>Download Failed:</strong> {loadError || 'An error occurred during download.'}
                    </p>
                    <p className="text-xs text-gray-400">Please restart the app and try again.</p>
                </div>
            )}
            {status === 'load_failed' && (
                <div>
                    <p className="text-sm text-red-400 mb-2">
                        <strong>Model Load Failed:</strong> {loadError}
                    </p>
                    <p className="text-xs text-gray-400">The model file may be corrupted. Try restarting the application. If the problem persists, you may need to delete the model file from the app's data directory and download it again.</p>
                </div>
            )}
            
            {status === 'not_found' && (
                <div>
                    <p className="text-sm text-yellow-400 mb-3">The AI model (~4.7 GB) is not found. Please download it to enable analysis.</p>
                    <button onClick={handleDownload} className="w-full bg-exportBlue-600 hover:bg-exportBlue-700 text-white font-bold py-2 px-4 rounded-lg transition">
                        Download Model
                    </button>
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
                <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-ecuGreen-400"></div>
                    <span className="font-semibold">Ready for Analysis</span>
                </div>
            )}
        </div>
    );
}
