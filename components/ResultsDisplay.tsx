import React from 'react';
import type { TuningSuggestions, Adjustment, Observation, DatalogRow, EngineType } from '../types';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { ExportActions } from './TuneExporter';

const AdjustmentCard: React.FC<{ adjustment: Adjustment; type: 'Fuel' | 'Ignition' }> = ({ adjustment, type }) => (
    <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold text-raceRed-400">{adjustment.rpmRange}</p>
                <p className="text-sm text-gray-400">{adjustment.loadCondition}</p>
            </div>
            {type === 'Fuel' && adjustment.currentAFR && (
                 <div className="text-right">
                    <p className="text-sm font-mono"><span className="text-gray-400">Current:</span> {adjustment.currentAFR} AFR</p>
                    <p className="text-sm font-mono"><span className="text-gray-400">Target:</span> {adjustment.targetAFR} AFR</p>
                </div>
            )}
        </div>
        <p className="mt-2 text-gray-200"><span className="font-semibold">Suggestion:</span> {adjustment.suggestion}</p>
        <p className="mt-1 text-sm text-gray-300"><span className="font-semibold">Reason:</span> {adjustment.reason}</p>
    </div>
);

const ObservationCard: React.FC<{ observation: Observation }> = ({ observation }) => (
    <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg">
        <p className="font-semibold text-gray-200">{observation.observation}</p>
        <p className="mt-1 text-raceRed-400"><span className="font-bold">Recommendation:</span> {observation.recommendation}</p>
    </div>
);

const DatalogChart: React.FC<{data: DatalogRow[]}> = ({data}) => {
    const chartData = data.map(row => ({
        RPM: row.RPM,
        AFR: row.AFR,
        MAP: row.MAP,
        Ignition: row['Ignition Total']
    }));

    return (
        <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-200">Datalog Visualization</h3>
            <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-lg h-80 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis dataKey="RPM" stroke="#A0AEC0" tick={{fontSize: 12}} label={{ value: 'RPM', position: 'insideBottom', offset: -5, fill: '#A0AEC0' }} />
                        <YAxis yAxisId="left" stroke="#F87171" tick={{fontSize: 12}} />
                        <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" tick={{fontSize: 12}}/>
                        <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #2D3748' }} />
                        <Legend wrapperStyle={{fontSize: "14px"}}/>
                        <Line yAxisId="left" type="monotone" dataKey="AFR" stroke="#F87171" dot={false} name="AFR" />
                        <Line yAxisId="right" type="monotone" dataKey="MAP" stroke="#9CA3AF" dot={false} name="MAP (psi/kPa)" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

interface ResultsDisplayProps {
  suggestions: TuningSuggestions;
  datalog: DatalogRow[];
  engineType: EngineType;
  baseMapFile?: File | null;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ suggestions, datalog, engineType, baseMapFile }) => {
  return (
    <div className="space-y-8 animate-fade-in">
        <div>
            <h3 className="text-xl font-semibold mb-2 text-gray-200">Overall Summary</h3>
            <p className="text-gray-300">{suggestions.summary}</p>
        </div>

        {datalog && datalog.length > 0 && <DatalogChart data={datalog}/>}

        <ExportActions suggestions={suggestions} engineType={engineType} baseMapFile={baseMapFile} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section>
                <h3 className="text-xl font-semibold mb-4 text-gray-200">Fuel Adjustments</h3>
                <div className="space-y-4">
                    {suggestions.fuelAdjustments.length > 0 ? (
                        suggestions.fuelAdjustments.map((adj, index) => <AdjustmentCard key={`fuel-${index}`} adjustment={adj} type="Fuel" />)
                    ) : <p className="text-gray-400">No specific fuel adjustments needed based on the log.</p>}
                </div>
            </section>
            
            <section>
                <h3 className="text-xl font-semibold mb-4 text-gray-200">Ignition Adjustments</h3>
                <div className="space-y-4">
                    {suggestions.ignitionAdjustments.length > 0 ? (
                        suggestions.ignitionAdjustments.map((adj, index) => <AdjustmentCard key={`ign-${index}`} adjustment={adj} type="Ignition" />)
                    ) : <p className="text-gray-400">No specific ignition adjustments needed based on the log.</p>}
                </div>
            </section>
        </div>
        
        <section>
             <h3 className="text-xl font-semibold mb-4 text-gray-200">Other Observations</h3>
             <div className="space-y-4">
                {suggestions.otherObservations.length > 0 ? (
                    suggestions.otherObservations.map((obs, index) => <ObservationCard key={`obs-${index}`} observation={obs} />)
                ) : <p className="text-gray-400">No other significant observations found.</p>}
            </div>
        </section>
    </div>
  );
};