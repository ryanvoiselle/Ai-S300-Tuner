import React, { useState } from 'react';
import type { TuningSuggestions, EngineType } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface ExportActionsProps {
  suggestions: TuningSuggestions;
  engineType: EngineType;
  baseMapFile?: File | null;
}

const generateTuningFileContent = (
  suggestions: TuningSuggestions, 
  engineType: EngineType, 
  baseMapName?: string
): string => {
  let content = `Hondata AI Tuning Suggestions\n\n`;
  content += `Generated: ${new Date().toLocaleString()}\n`;
  content += `Engine Type: ${engineType === 'na' ? 'Naturally Aspirated' : 'Boosted'}\n`;
  content += `Base Map: ${baseMapName || 'Not provided'}\n\n`;

  content += `--- DISCLAIMER ---\n`;
  content += `This file contains AI-generated suggestions. Review these changes carefully before applying them to your base map. Always tune on a dynamometer with a professional tuner. Use at your own risk.\n\n`;

  content += `--- SUMMARY ---\n${suggestions.summary}\n\n`;

  if (suggestions.fuelAdjustments.length > 0) {
    content += `--- FUEL ADJUSTMENTS ---\n`;
    suggestions.fuelAdjustments.forEach((adj, index) => {
      content += `${index + 1}. RPM Range: ${adj.rpmRange}\n`;
      content += `   Load: ${adj.loadCondition}\n`;
      content += `   Current AFR: ${adj.currentAFR || 'N/A'}\n`;
      content += `   Target AFR: ${adj.targetAFR || 'N/A'}\n`;
      content += `   Suggestion: ${adj.suggestion}\n`;
      content += `   Reason: ${adj.reason}\n\n`;
    });
  }

  if (suggestions.ignitionAdjustments.length > 0) {
    content += `--- IGNITION ADJUSTMENTS ---\n`;
    suggestions.ignitionAdjustments.forEach((adj, index) => {
      content += `${index + 1}. RPM Range: ${adj.rpmRange}\n`;
      content += `   Load: ${adj.loadCondition}\n`;
      content += `   Suggestion: ${adj.suggestion}\n`;
      content += `   Reason: ${adj.reason}\n\n`;
    });
  }

  if (suggestions.otherObservations.length > 0) {
    content += `--- OTHER OBSERVATIONS ---\n`;
    suggestions.otherObservations.forEach((obs, index) => {
      content += `${index + 1}. Observation: ${obs.observation}\n`;
      content += `   Recommendation: ${obs.recommendation}\n\n`;
    });
  }

  return content;
};

export const ExportActions: React.FC<ExportActionsProps> = ({ 
  suggestions, 
  engineType, 
  baseMapFile 
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadTxt = async () => {
    setIsExporting(true);
    try {
      const fileContent = generateTuningFileContent(suggestions, engineType, baseMapFile?.name);
      const fileName = `Hondata_AI_Suggestions_${new Date().toISOString().split('T')[0]}.txt`;
      
      if (window.electronAPI) {
        // Electron version - use native file dialog
        const result = await window.electronAPI.saveFile({
          title: 'Save Tuning Suggestions',
          defaultPath: fileName,
          filters: [
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });
        
        if (!result.canceled && result.filePath) {
          await window.electronAPI.writeFile(result.filePath, fileContent);
          alert('Tuning suggestions saved successfully!');
        }
      } else {
        // Web version - use browser download
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export tuning suggestions');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSkl = async () => {
    if (!baseMapFile) return;

    setIsExporting(true);
    try {
      // This is a placeholder for the SKL modification functionality
      // In a real implementation, this would parse and modify the binary SKL file
      alert('SKL modification feature is coming soon! For now, use the text export to manually apply changes.');
    } catch (error) {
      console.error('SKL export failed:', error);
      alert('Failed to export modified map file');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mt-6 bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
      <h4 className="text-lg font-semibold text-gray-200">Export Actions</h4>
      <p className="text-sm text-gray-400 mt-1 mb-3">
        Download a detailed change log or export for manual application.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleDownloadTxt}
          disabled={isExporting}
          className="w-full sm:w-auto bg-exportBlue-600 hover:bg-exportBlue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center space-x-2"
        >
          {isExporting ? (
            <LoadingSpinner />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
          <span>Download Change Log (.txt)</span>
        </button>
        
        <button
          onClick={handleDownloadSkl}
          disabled={!baseMapFile || isExporting}
          className="w-full sm:w-auto bg-ecuGreen-600 hover:bg-ecuGreen-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition duration-300"
        >
          {isExporting ? (
            <LoadingSpinner />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          )}
          <span>Export for Manual Application</span>
        </button>
      </div>
      
      {!baseMapFile && (
        <p className="text-xs text-yellow-400 mt-2">
          Upload a .skl base map to enable additional export options.
        </p>
      )}
    </div>
  );
};