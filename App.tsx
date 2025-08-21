import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Configuration } from './components/Configuration';
import { ResultsDisplay } from './components/ResultsDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Disclaimer } from './components/Disclaimer';
import { ECUConnector } from './components/ECUConnector';
import { Simulator } from './components/Simulator';
import { getTuningSuggestions } from './services/geminiService';
import { generateSimulatedDatalog } from './services/simulationService';
import type { EngineType, TuningSuggestions, DatalogRow, SimulationScenario } from './types';
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
            if(results.errors.length > 0) {
                setError(`Error parsing CSV: ${results.errors[0].message}`);
                setDatalogData([]);
            } else {
                const validData = results.data.filter(row => row.RPM !== null && row.RPM > 0);
                setDatalogData(validData);
            }
        }
    });
  }

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
      }
      reader.readAsText(file);
    } else {
        setDatalogContent('');
    }
  };
  
  const handleBaseMapFileChange = (file: File | null) => {
    setBaseMapFile(file);
  }

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
    setIsLoading(true);
    setError(null);
    setTuningSuggestions(null);

    try {
      const suggestions = await getTuningSuggestions(datalogContent, engineType, engineSetup, turboSetup);
      setTuningSuggestions(suggestions);
    } catch (e) {
      console.error(e);
      setError('Failed to get tuning suggestions. The AI model may be overloaded or an error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [datalogContent, engineType, engineSetup, turboSetup]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        <main className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 flex flex-col gap-8">
             <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-fit">
                <h2 className="text-2xl font-bold mb-4 text-cyan-400">1. Configure & Analyze</h2>
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
                <button
                    onClick={handleAnalyze}
                    disabled={!datalogContent || isLoading}
                    className="w-full mt-6 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
                >
                    {isLoading ? <LoadingSpinner /> : 'Analyze Datalog'}
                </button>
            </div>
            <Simulator onGenerate={handleGenerateSimulation} isLoading={isLoading} />
            <ECUConnector />
          </div>

          <div className="lg:col-span-2">
             <h2 className="text-2xl font-bold mb-4 text-cyan-400">2. AI Analysis & Suggestions</h2>
             <div className="bg-gray-800 p-6 rounded-lg shadow-lg min-h-[30rem]">
                {error && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">{error}</div>}
                
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <LoadingSpinner />
                        <p className="mt-4 text-lg text-gray-300">Analyzing datalog...</p>
                        <p className="text-sm text-gray-400">The AI is reviewing your data against your hardware setup.</p>
                    </div>
                )}

                {!isLoading && !tuningSuggestions && !error && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <h3 className="text-xl font-semibold">Ready for Analysis</h3>
                        <p>Open your files, detail your setup, and click Analyze.</p>
                    </div>
                )}
                
                {tuningSuggestions && <ResultsDisplay suggestions={tuningSuggestions} datalog={datalogData} engineType={engineType} baseMapFile={baseMapFile}/>}
             </div>
          </div>
        </main>
        
        <Disclaimer />
      </div>
    </div>
  );
};

export default App;