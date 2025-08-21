import React from 'react';

// --- Main AI Manager Component ---

export const AIManager: React.FC = () => {
    return (
        <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg shadow-lg h-fit backdrop-blur-sm">
            <h3 className="text-lg font-bold text-gray-200 mb-2">AI Provider Status</h3>
            <div className="bg-gray-800/50 p-3 rounded-lg flex items-center space-x-3">
                 <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                 </div>
                 <div>
                    <p className="font-semibold text-sm text-gray-200">Google Gemini API</p>
                    <p className="text-xs text-green-400">Ready for Analysis</p>
                </div>
            </div>
             <p className="text-xs text-gray-500 mt-3">
                The application uses the Gemini API. Ensure your API_KEY is set correctly in your environment.
            </p>
        </div>
    );
};