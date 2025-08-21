import React from 'react';
import { FileUpload } from './FileUpload';
import { OptionsSelector } from './OptionsSelector';
import type { EngineType } from '../types';

interface ConfigurationProps {
    datalogFile: File | null;
    onDatalogFileChange: (file: File | null) => void;
    baseMapFile: File | null;
    onBaseMapFileChange: (file: File | null) => void;
    engineType: EngineType;
    onEngineTypeChange: (type: EngineType) => void;
    engineSetup: string;
    onEngineSetupChange: (value: string) => void;
    turboSetup: string;
    onTurboSetupChange: (value: string) => void;
}

export const Configuration: React.FC<ConfigurationProps> = (props) => {
    return (
        <div className="space-y-6">
            <FileUpload
                id="datalog-upload"
                label="Datalog File (.csv)"
                accept=".csv"
                selectedFile={props.datalogFile}
                onFileChange={props.onDatalogFileChange}
                helpText="Export your datalog from SManager as a CSV file."
            />
            <FileUpload
                id="basemap-upload"
                label="Base Map File (.skl)"
                accept=".skl"
                selectedFile={props.baseMapFile}
                onFileChange={props.onBaseMapFileChange}
                helpText="Optional: Upload your current tune file for more specific advice."
            />
            <OptionsSelector selectedType={props.engineType} onTypeChange={props.onEngineTypeChange} />
            <div>
                <label htmlFor="engine-setup" className="block text-sm font-medium text-gray-300 mb-2">Engine Setup Details</label>
                <textarea
                    id="engine-setup"
                    rows={3}
                    value={props.engineSetup}
                    onChange={(e) => props.onEngineSetupChange(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="e.g., K20A2, stock block, BC Stage 2 cams, ID 1050x injectors"
                ></textarea>
            </div>
            <div>
                <label htmlFor="turbo-setup" className="block text-sm font-medium text-gray-300 mb-2">Turbo / Induction Setup</label>
                <textarea
                    id="turbo-setup"
                    rows={2}
                    value={props.turboSetup}
                    onChange={(e) => props.onTurboSetupChange(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="e.g., Garrett GTX3076R Gen II, 14psi, Sidewinder manifold"
                ></textarea>
                 <p className="text-xs text-gray-500 mt-1">If naturally aspirated, you can mention intake, header, etc.</p>
            </div>
        </div>
    );
};
