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

export type AIProvider = 'local' | 'gemini';

export interface AuthUser {
  name: string;
  email: string;
  picture: string;
}

export interface AuthStatus {
  isSignedIn: boolean;
  user?: AuthUser | null;
}

export interface ElectronAPI {
  getInitialModelStatus: () => Promise<{ exists: boolean; loaded: boolean; error?: string | null }>;
  downloadModel: () => Promise<void>;
  onDownloadProgress: (callback: (progress: { percent: number; totalBytes: number; }) => void) => void;
  onModelLoadAttemptComplete: (callback: (status: { loaded: boolean; error?: string; }) => void) => void;
  googleSignIn: () => Promise<AuthStatus>;
  googleSignOut: () => Promise<AuthStatus>;
  getAuthStatus: () => Promise<AuthStatus>;
  runInference: (args: { provider: AIProvider; prompt?: string; systemPrompt?: string; userPrompt?: string; }) => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
