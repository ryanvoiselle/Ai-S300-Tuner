import React from 'react';
import type { EngineType } from '../types';

interface OptionsSelectorProps {
  selectedType: EngineType;
  onTypeChange: (type: EngineType) => void;
}

export const OptionsSelector: React.FC<OptionsSelectorProps> = ({ selectedType, onTypeChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Engine Type</label>
      <div className="flex space-x-2">
        <button
          onClick={() => onTypeChange('na')}
          className={`w-full py-2 px-4 rounded-lg transition-colors duration-200 font-semibold ${
            selectedType === 'na' ? 'bg-raceRed-500 text-white shadow-md' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Naturally Aspirated
        </button>
        <button
          onClick={() => onTypeChange('boosted')}
          className={`w-full py-2 px-4 rounded-lg transition-colors duration-200 font-semibold ${
            selectedType === 'boosted' ? 'bg-raceRed-500 text-white shadow-md' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Boosted
        </button>
      </div>
    </div>
  );
};