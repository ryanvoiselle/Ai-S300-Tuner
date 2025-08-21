import React from 'react';

export const Header: React.FC = () => (
  <header className="text-center">
    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-raceRed-400 to-gray-200">
      Hondata AI Tuning Assistant
    </h1>
    <p className="mt-2 text-lg text-gray-400">
      Upload your S300 datalog to get expert tuning advice
    </p>
  </header>
);