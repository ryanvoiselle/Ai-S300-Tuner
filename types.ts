export type EngineType = 'na' | 'boosted';

export type SimulationScenario = 'leanWot' | 'richCruise' | 'highDuty' | 'knock';

export interface Adjustment {
  rpmRange: string;
  loadCondition: string;
  suggestion: string;
  reason: string;
  currentAFR?: string; // Optional as it's specific to fuel
  targetAFR?: string; // Optional as it's specific to fuel
}

export interface Observation {
  observation: string;
  recommendation: string;
}

export interface TuningSuggestions {
  summary: string;
  fuelAdjustments: Adjustment[];
  ignitionAdjustments: Adjustment[];
  otherObservations: Observation[];
}

export interface DatalogRow {
  Time?: number;
  RPM: number;
  MAP: number; // Expecting psi or kPa
  AFR?: number;
  'Ignition Total'?: number;
  'Injector Duty'?: number;
  VTP?: number; // VTEC pressure switch
  VTS?: number; // VTEC solenoid
  [key: string]: number | undefined; // Allow other numeric columns
}