import React, { useState } from 'react';
import type { SimulationScenario } from '../types';

interface SimulatorProps {
    onGenerate: (scenario: SimulationScenario) => void;
    isLoading: boolean;
}

const scenarios: { id: SimulationScenario; name: string; description: string }[] = [
    { id: 'leanWot', name: 'Lean WOT Pull', description: 'Simulates a WOT run with a dangerously lean air-fuel ratio.' },
    { id: 'richCruise', name: 'Rich Cruise', description: 'Simulates steady cruising with an excessively rich mixture.' },
    { id: 'highDuty', name: 'High Injector Duty', description: 'Simulates a high-RPM pull where injectors are maxed out.' },
    { id: 'knock', name: 'Potential Knock Event', description: 'Simulates a timing drop characteristic of a knock event.' },
];

export const Simulator: React.FC<SimulatorProps> = ({ onGenerate, isLoading }) => {
    const [selectedScenario, setSelectedScenario] = useState<SimulationScenario>('leanWot');

    const handleGenerateClick = () => {
        onGenerate(selectedScenario);
    };

    return (
        <div className="bg-gray-900/50 border border-gray-700 p-6 rounded-lg shadow-lg h-fit backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-4 text-raceRed-400">ECU Simulator / Test Environment</h2>
            <p className="text-sm text-gray-400 mb-4">
                Don't have a datalog? Generate a simulated one to test the AI's analysis capabilities on common tuning issues.
            </p>
            <div className="space-y-4">
                <div>
                    <label htmlFor="scenario-select" className="block text-sm font-medium text-gray-300 mb-2">
                        Select a Scenario
                    </label>
                    <select
                        id="scenario-select"
                        value={selectedScenario}
                        onChange={(e) => setSelectedScenario(e.target.value as SimulationScenario)}
                        className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-lg p-2 focus:ring-raceRed-500 focus:border-raceRed-500 transition"
                    >
                        {scenarios.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                     <p className="text-xs text-gray-500 mt-1">{scenarios.find(s => s.id === selectedScenario)?.description}</p>
                </div>
                <button
                    onClick={handleGenerateClick}
                    disabled={isLoading}
                    className="w-full bg-simPurple-600 hover:bg-simPurple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                >
                    Generate Test Data
                </button>
            </div>
        </div>
    );
};