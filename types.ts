
export enum DangerLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface Obstacle {
  id: string;
  label: string;
  distance: number; // in meters
  dangerLevel: DangerLevel;
  position: 'left' | 'center' | 'right';
}

export interface SceneDescription {
  summary: string;
  obstacles: Obstacle[];
  floorSafe: boolean;
  navAdvice: string;
}

export interface AppState {
  isScanning: boolean;
  isDescribing: boolean;
  lastDescription: string | null;
  obstacles: Obstacle[];
  error: string | null;
}
