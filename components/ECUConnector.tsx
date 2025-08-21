import React, { useState } from 'react';

type ECUStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export const ECUConnector: React.FC = () => {
  const [status, setStatus] = useState<ECUStatus>('disconnected');
  const [selectedPort, setSelectedPort] = useState<string>('COM3');

  const handleConnect = async () => {
    setStatus('connecting');
    console.log(`Attempting to connect to ECU via ${selectedPort}...`);

    // In a real desktop app (e.g., using Electron), this would call a Node.js
    // native module like 'serialport' to establish a real hardware connection.
    // We simulate the delay and potential outcomes here.
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate a successful connection
    setStatus('connected');
    console.log(`Successfully connected to ${selectedPort}.`);
  };
  
  const handleDisconnect = () => {
      setStatus('disconnected');
      console.log("Disconnected from ECU.");
  }

  const getStatusIndicator = () => {
      switch(status) {
          case 'connected':
              return <span className="text-ecuGreen-400">Connected</span>;
          case 'connecting':
              return <span className="text-yellow-400">Connecting...</span>;
          case 'error':
              return <span className="text-red-400">Error</span>;
          case 'disconnected':
          default:
              return <span className="text-gray-400">Disconnected</span>;
      }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-700 p-6 rounded-lg shadow-lg h-fit backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-4 text-raceRed-400">3. Live ECU Connection</h2>
        <p className="text-sm text-gray-400 mb-4">
            Connect directly to your ECU for real-time data logging or to flash a new map. This requires a compatible CAN-to-USB adapter.
        </p>

        <div className="space-y-4">
            <div>
                <label htmlFor="com-port-select" className="block text-sm font-medium text-gray-300 mb-2">
                    Select COM Port
                </label>
                <select
                    id="com-port-select"
                    value={selectedPort}
                    onChange={(e) => setSelectedPort(e.target.value)}
                    disabled={status === 'connecting' || status === 'connected'}
                    className="w-full bg-gray-700/50 border border-gray-600 text-white rounded-lg p-2 focus:ring-raceRed-500 focus:border-raceRed-500 disabled:opacity-50 transition"
                >
                    {/* In a real app, these ports would be detected automatically */}
                    <option>COM1</option>
                    <option>COM3</option>
                    <option>COM4</option>
                    <option>/dev/ttyUSB0</option>
                </select>
            </div>
            <div className="flex items-center space-x-4">
                {status !== 'connected' ? (
                    <button
                        onClick={handleConnect}
                        disabled={status === 'connecting'}
                        className="w-full bg-ecuGreen-600 hover:bg-ecuGreen-700 disabled:bg-gray-600 disabled:cursor-wait text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                    >
                        {status === 'connecting' ? 'Connecting...' : 'Connect'}
                    </button>
                ) : (
                    <button
                        onClick={handleDisconnect}
                        className="w-full bg-raceRed-600 hover:bg-raceRed-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                    >
                        Disconnect
                    </button>
                )}
                 <div className="flex items-center space-x-2 flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-ecuGreen-400 animate-pulse' : status === 'connecting' ? 'bg-yellow-400' : 'bg-gray-500'}`}></div>
                    <span className="font-semibold text-sm">{getStatusIndicator()}</span>
                </div>
            </div>
        </div>

        <div className="mt-6 border-t border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-300">Real-time Data</h3>
            <div className="flex items-center justify-center h-24 mt-2 bg-gray-800/50 rounded-lg">
                <p className="text-gray-500">
                    {status === 'connected' ? 'Real-time gauges would appear here.' : 'Connect to ECU to view live data.'}
                </p>
            </div>
        </div>
    </div>
  );
};