
import React from 'react';

export const Disclaimer: React.FC = () => (
    <footer className="mt-12 text-center text-sm text-gray-500 border-t border-gray-700 pt-6">
        <p className="font-bold text-red-500">
            DISCLAIMER: Engine tuning is inherently risky.
        </p>
        <p className="mt-1 max-w-3xl mx-auto">
            These AI-generated suggestions are for educational and informational purposes only. Always have your vehicle tuned by a qualified professional on a dynamometer. The creators of this application are not responsible for any damage to your engine, vehicle, or any personal injury that may result from using this information. <span className="font-bold">Use at your own risk.</span>
        </p>
    </footer>
);