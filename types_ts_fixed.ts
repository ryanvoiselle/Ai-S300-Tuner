export type EngineType = 'na' | 'boosted';

export type SimulationScenario = 'leanWot' | 'richCruise' | 'highDuty' | 'knock';

export type AIProvider = 'cloud' | 'local';

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

export interface ElectronAPI {
  // AI Configuration
  getAiConfig: () => Promise<{
    hasGeminiKey: boolean;
    hasLocalModel: boolean;
    currentProvider: string;
  }>;
  setGeminiKey: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
  setAiProvider: (provider: string) => Promise<{ success: boolean; error?: string }>;
  
  // AI Analysis
  runAiAnalysis: (params: {
    datalog: string;
    engineType: EngineType;
    engineSetup: string;
    turboSetup: string;
  }) => Promise<{
    success: boolean;
    suggestions?: TuningSuggestions;
    error?: string;
  }>;
  
  // File Operations
  selectFile: (options: any) => Promise<any>;
  saveFile: (options: any) => Promise<any>;
  writeFile: (filePath: string, data: string) => Promise<{ success: boolean; error?: string }>;
  
  // App Info
  getAppInfo: () => Promise<{
    version: string;
    name: string;
    userDataPath: string;
    logPath: string;
  }>;
  
  // Utility
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}