import React, { useState } from 'react';
import type { AIProvider } from '../types';

interface AISettingsProps {
  provider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  config: {
    hasGeminiKey: boolean;
    hasLocalModel: boolean;
    currentProvider: string;
  };
  onConfigUpdate: (config: any) => void;
}

export const AISettings: React.FC<AISettingsProps> = ({
  provider,
  onProviderChange,
  config,
  onConfigUpdate
}) => {
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSettingKey, setIsSettingKey] = useState(false);

  const handleSetApiKey = async () => {
    if (!apiKeyInput.trim()) {
      alert('Please enter a valid API key');
      return;
    }

    setIsSettingKey(true);
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.setGeminiKey(apiKeyInput.trim());
        if (result.success) {
          setShowApiKeyInput(false);
          setApiKeyInput('');
          // Update config
          const newConfig = await window.electronAPI.getAiConfig();
          onConfigUpdate(newConfig);
          alert('API key configured successfully!');
        } else {
          alert(`Failed to set API key: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Error setting API key:', error);
      alert('Failed to configure API key');
    } finally {
      setIsSettingKey(false);
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-lg shadow-lg h-fit backdrop-blur-sm">
      <h3 className="text-lg font-bold text-gray-200 mb-3">AI Provider Settings</h3>
      
      {/* Provider Selector */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-4">
        <button
          onClick={() => onProviderChange('cloud')}
          className={`w-full py-1.5 px-2 rounded-md transition-colors text-sm font-semibold ${
            provider === 'cloud' ? 'bg-raceRed-500 text-white' : 'hover:bg-gray-700'
          }`}
        >
          Cloud AI
        </button>
        <button
          onClick={() => onProviderChange('local')}
          className={`w-full py-1.5 px-2 rounded-md transition-colors text-sm font-semibold ${
            provider === 'local' ? 'bg-raceRed-500 text-white' : 'hover:bg-gray-700'
          }`}
        >
          Local AI
        </button>
      </div>

      {/* Cloud AI Configuration */}
      {provider === 'cloud' && (
        <div className="space-y-3">
          {config.hasGeminiKey ? (
            <div className="flex items-center space-x-3 bg-gray-800/50 p-3 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-ecuGreen-400 flex-shrink-0"></div>
              <span className="font-semibold text-sm">Gemini API Key Configured</span>
              <button
                onClick={() => setShowApiKeyInput(true)}
                className="text-xs text-raceRed-400 hover:underline ml-auto"
              >
                Change
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-yellow-400 mb-3">
                Cloud AI requires a Google Gemini API key. Get one from the Google AI Studio.
              </p>
              {!showApiKeyInput ? (
                <button
                  onClick={() => setShowApiKeyInput(true)}
                  className="w-full bg-exportBlue-600 hover:bg-exportBlue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Configure API Key
                </button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-lg p-2 focus:ring-raceRed-500 focus:border-raceRed-500 transition"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSetApiKey}
                      disabled={isSettingKey}
                      className="flex-1 bg-ecuGreen-600 hover:bg-ecuGreen-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                      {isSettingKey ? 'Setting...' : 'Save Key'}
                    </button>
                    <button
                      onClick={() => {
                        setShowApiKeyInput(false);
                        setApiKeyInput('');
                      }}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Local AI Configuration */}
      {provider === 'local' && (
        <div className="space-y-3">
          {config.hasLocalModel ? (
            <div className="flex items-center space-x-3 bg-gray-800/50 p-3 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-ecuGreen-400 flex-shrink-0"></div>
              <span className="font-semibold text-sm">Local Model Ready</span>
            </div>
          ) : (
            <div>
              <p className="text-sm text-yellow-400 mb-3">
                Local AI model not available. This feature is coming soon.
              </p>
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <p className="text-xs text-gray-400">
                  Local AI will allow completely offline analysis once implemented.
                  For now, please use the Cloud AI option.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* API Key Help */}
      {provider === 'cloud' && (
        <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
          <p className="text-xs text-gray-400">
            <strong>How to get a Gemini API key:</strong>
          </p>
          <ol className="text-xs text-gray-400 mt-1 space-y-1">
            <li>1. Visit <span className="text-exportBlue-400">https://makersuite.google.com/app/apikey</span></li>
            <li>2. Sign in with your Google account</li>
            <li>3. Click "Create API Key"</li>
            <li>4. Copy and paste the key above</li>
          </ol>
        </div>
      )}
    </div>
  );
};
            