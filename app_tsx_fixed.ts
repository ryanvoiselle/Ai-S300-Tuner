import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Configuration } from './components/Configuration';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Disclaimer } from './components/Disclaimer';
import { Simulator } from './components/Simulator';
import { AISettings } from './components/AISettings';
import { generateSimulatedDatalog } from './services/simulationService';
import type { EngineType, TuningSuggestions, DatalogRow, SimulationScenario, AIProvider } from './types';
import Papa from 'papaparse';

const App: React.FC = () => {
  const [datalogFile, setDatalogFile] = useState<File | null>(null);
  const [baseMapFile, setBaseMapFile] = useState<File | null>(null);
  const [datalogContent, setDatalogContent] = useState<string>('');
  const [engineType, setEngineType] = useState<EngineType>('na');
  const [engineSetup, setEngineSetup] = useState<string>('');
  const [turboSetup, setTurboSetup] = useState<string>('');
  const [tuningSuggestions, setTuningSuggestions] = useState<TuningSuggestions | null>(null);
  const [datalogData, setDatalogData] = useState<DatalogRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // AI Configuration state
  const [aiProvider, setAiProvider] = useState<AIProvider>('cloud');
  const [aiConfig, setAiConfig] = useState<{
    hasGeminiKey: boolean;
    hasLocalModel: boolean;
    currentProvider: string;
  }>({
    hasGeminiKey: false,
    hasLocalModel: false,
    currentProvider: 'cloud'
  });

  // Check AI configuration on component mount
  useEffect(() => {
    const checkAiConfig = async () => {
      if (window.electronAPI) {
        try {
          const config = await window.electronAPI.getAiConfig();
          setAiConfig(config);
          setAiProvider(config.currentProvider as AIProvider);
        } catch (error) {
          console.error('Failed to get AI config:', error);
        }
      }
    };
    
    checkAiConfig();
  }, []);

  const processDatalogContent = (content: string) => {
    if (!content.includes('RPM') || !content.includes('MAP')) {
      setError('Invalid CSV. Ensure it is a valid Hondata datalog export with RPM and MAP columns.');
      setDatalogContent('');
      setDatalogFile(null);
      return;
    }
    
    setDatalogContent(content);

    Papa.parse<DatalogRow>(content, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`Error parsing CSV: ${results.errors[0].message}`);
          setDatalogData([]);
        } else {
          const validData = results.data.filter(row => row.RPM !== null && row.RPM > 0);
          setDatalogData(validData);
          setError(null);
        }
      }
    });
  };

  const handleDatalogFileChange = (file: File | null) => {
    setDatalogFile(file);
    setTuningSuggestions(null);
    setError(null);
    setDatalogData([]);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        processDatalogContent(content);
      };
      reader.onerror = () => {
        setError('Failed to read the file.');
      };
      reader.readAsText(file);
    } else {
      setDatalogContent('');
    }
  };
  
  const handleBaseMapFileChange = (file: File | null) => {
    setBaseMapFile(file);
  };

  const handleGenerateSimulation = useCallback((scenario: SimulationScenario) => {
    setError(null);
    setTuningSuggestions(null);
    setDatalogFile(null);
    setBaseMapFile(null);
    const simulatedContent = generateSimulatedDatalog(scenario);
    processDatalogContent(simulatedContent);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!datalogContent) {
      setError('Please upload or generate a datalog file first.');
      return;
    }

    // Check AI provider readiness
    if (aiProvider === 'cloud' && !aiConfig.hasGeminiKey) {
      setError('Please configure your Gemini API key in the AI Settings section.');
      return;
    }
    
    if (aiProvider === 'local' && !aiConfig.hasLocalModel) {
      setError('Local AI model not available. Please use cloud provider or configure local model.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setTuningSuggestions(null);

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.runAiAnalysis({
          datalog: datalogContent,
          engineType,
          engineSetup,
          turboSetup
        });

        if (result.success) {
          setTuningSuggestions(result.suggestions);
        } else {
          setError(result.error || 'AI analysis failed');
        }
      } else {
        // Fallback for web version
        setError('This feature requires the desktop application.');
      }
    } catch (e) {
      console.error('Analysis error:', e);
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred during AI analysis.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [datalogContent, engineType, engineSetup, turboSetup, aiProvider, aiConfig]);

  const handleAiProviderChange = async (provider: AIProvider) => {
    setAiProvider(provider);
    if (window.electronAPI) {
      try {
        await window.electronAPI.setAiProvider(provider);
        const config = await window.electronAPI.getAiConfig();
        setAiConfig(config);
      } catch (error) {
        console.error('Failed to set AI provider:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-charcoal text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <Header />

        <main className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-gray-900/50 border border-gray-700 p-6 rounded-lg shadow-lg h-fit backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-4 text-raceRed-400">1. Configure Datalog</h2>
              <Configuration
                datalogFile={datalogFile}
                onDatalogFileChange={handleDatalogFileChange}
                baseMapFile={baseMapFile}
                onBaseMapFileChange={handleBaseMapFileChange}
                engineType={engineType}
                onEngineTypeChange={setEngineType}
                engineSetup={engineSetup}
                onEngineSetupChange={setEngineSetup}
                turboSetup={turboSetup}
                onTurboSetupChange={setTurboSetup}
              />
            </div>
            
            <AISettings
              provider={aiProvider}
              onProviderChange={handleAiProviderChange}
              config={aiConfig}
              onConfigUpdate={setAiConfig}
            />
            
            <Simulator onGenerate={handleGenerateSimulation} isLoading={isLoading} />
          </div>

          <div className="lg:col-span-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-raceRed-400">2. AI Analysis & Suggestions</h2>
              <button
                onClick={handleAnalyze}
                disabled={!datalogContent || isLoading}
                className="bg-raceRed-500 hover:bg-raceRed-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center shadow-lg shadow-raceRed-500/20 text-lg"
              >
                {isLoading ? <LoadingSpinner /> : 'Analyze Datalog'}
              </button>
            </div>
            
            <div className="bg-gray-900/50 border border-gray-700 p-6 rounded-lg shadow-lg min-h-[60rem] backdrop-blur-sm">
              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4" role="alert">
                  {error}
                </div>
              )}
              
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <LoadingSpinner />
                  <p className="mt-4 text-lg text-gray-300">Analyzing datalog with {aiProvider} AI...</p>
                  <p className="text-sm text-gray-400">This may take a moment...</p>
                </div>
              )}

              {!isLoading && !tuningSuggestions && !error && (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-300">Ready for Analysis</h3>
                  <p>Configure your datalog, select an AI provider, and click Analyze.</p>
                </div>
              )}
              
              {tuningSuggestions && (
                <ResultsDisplay 
                  suggestions={tuningSuggestions} 
                  datalog={datalogData} 
                  engineType={engineType} 
                  baseMapFile={baseMapFile}
                />
              )}
            </div>
          </div>
        </main>
        
        <Disclaimer />
      </div>
    </div>
  );
};

export default App;