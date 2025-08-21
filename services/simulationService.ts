import type { SimulationScenario, DatalogRow } from '../types';

const CSV_HEADER = 'Time,RPM,MAP,AFR,"Ignition Total","Injector Duty"';

const generateCsvString = (data: Partial<DatalogRow>[]): string => {
    const rows = data.map(row => 
        `${row.Time?.toFixed(3)},${row.RPM},${row.MAP?.toFixed(2)},${row.AFR?.toFixed(2)},${row['Ignition Total']?.toFixed(1)},${row['Injector Duty']?.toFixed(1)}`
    );
    return [CSV_HEADER, ...rows].join('\n');
};

// Scenario: Full throttle pull from 2500 to 7500 RPM with AFRs leaning out dangerously
const createLeanWot = (): string => {
    const data: Partial<DatalogRow>[] = [];
    for (let i = 0; i <= 100; i++) {
        const progress = i / 100; // 0 to 1
        const rpm = 2500 + 5000 * progress;
        data.push({
            Time: 5 * progress,
            RPM: Math.round(rpm),
            MAP: 14.5, // WOT under boost
            AFR: 12.5 + 2 * progress, // Starts ok, gets dangerously lean (14.5)
            'Ignition Total': 20 - 5 * progress, // Timing pulls back slightly at high RPM
            'Injector Duty': 40 + 45 * progress,
        });
    }
    return generateCsvString(data);
};

// Scenario: Steady 3000 RPM cruise with a rich mixture
const createRichCruise = (): string => {
    const data: Partial<DatalogRow>[] = [];
    for (let i = 0; i <= 50; i++) {
        data.push({
            Time: 0.1 * i,
            RPM: 3000 + Math.round((Math.random() - 0.5) * 50), // Steady RPM
            MAP: -8.5, // Cruising vacuum
            AFR: 12.8 + (Math.random() - 0.5) * 0.5, // Consistently rich for cruise
            'Ignition Total': 38,
            'Injector Duty': 15,
        });
    }
    return generateCsvString(data);
};

// Scenario: High RPM pull where injector duty cycle exceeds safe limits
const createHighDuty = (): string => {
    const data: Partial<DatalogRow>[] = [];
    for (let i = 0; i <= 80; i++) {
        const progress = i / 80;
        const rpm = 5000 + 3500 * progress;
        data.push({
            Time: 4 * progress,
            RPM: Math.round(rpm),
            MAP: 15.0,
            AFR: 11.5, // Correct AFR, but injectors are struggling
            'Ignition Total': 18,
            'Injector Duty': 75 + 24 * progress, // Climbs from 75% to 99%
        });
    }
    return generateCsvString(data);
};

// Scenario: A pull where timing is suddenly pulled, indicating a knock event
const createKnockEvent = (): string => {
    const data: Partial<DatalogRow>[] = [];
    for (let i = 0; i <= 60; i++) {
        const progress = i / 60;
        const rpm = 4000 + 2500 * progress;
        let ignition = 25 + 5 * progress;
        // Simulate a knock event around 5500 RPM
        if (rpm > 5400 && rpm < 5800) {
            ignition -= 6; // ECU pulls timing
        }
        data.push({
            Time: 3 * progress,
            RPM: Math.round(rpm),
            MAP: 12.0,
            AFR: 11.8,
            'Ignition Total': ignition,
            'Injector Duty': 60 + 20 * progress,
        });
    }
    return generateCsvString(data);
};


export const generateSimulatedDatalog = (scenario: SimulationScenario): string => {
    switch (scenario) {
        case 'leanWot':
            return createLeanWot();
        case 'richCruise':
            return createRichCruise();
        case 'highDuty':
            return createHighDuty();
        case 'knock':
            return createKnockEvent();
        default:
            return CSV_HEADER;
    }
};
