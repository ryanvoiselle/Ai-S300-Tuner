
import React, { useState, useEffect } from 'react';

type ModelStatus = 'checking' | 'not_found' | 'downloading' | 'ready' | 'error';

export const AIModelManager: React.FC<{isModelReady: boolean; setIsModelReady: (isReady: boolean) => void;}> = ({isModelReady, setIsModelReady}) => {
    const [status, setStatus] = useState<ModelStatus>('checking');
    const [progress, setProgress] = useState(0);
    const [totalSize, setTotalSize] = useState(0);

    useEffect(() => {
        window.electronAPI.checkModelExists().then(exists => {
            if (exists) {
                setStatus('ready');
                setIsModelReady(true);
            } else {
                setStatus('not_found');
                setIsModelReady(false);
            }
        });
        
        window.electronAPI.onDownloadProgress(prog => {
           setProgress(prog.percent);
           if (!totalSize) {
             setTotalSize(prog.totalBytes);
           }
        });

    }, [setIsModelReady, totalSize]);

    const handleDownload = () => {
        setStatus('downloading');
        window.electronAPI.downloadModel().then(() => {
            setStatus('ready');
            setIsModelReady(true);
        }).catch(() => {
            setStatus('error');
            setIsModelReady(false);
        });
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
            {status === 'error' && <p className="text-red-400">An error occurred during download. Please restart the app and try again.</p>}
            
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
