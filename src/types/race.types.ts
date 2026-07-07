export type JudgeResult = 'perfect' | 'good' | 'miss';

export type InputType = 'tap' | 'hold' | 'swipe_left' | 'swipe_right' | 'clutch_tap';

export type EnvironmentType = 'calm' | 'headwind' | 'tailwind' | 'shallow' | 'rain';

export type RacePhase = 'prep' | 'racing' | 'clutch' | 'finished';

export type RaceMode = 'quick' | 'story' | 'daily';

export interface TapEvent {
  frame: number;
  type: InputType;
  holdDurationMs?: number;
}

export interface Beat {
  timeMs: number;
  index: number;
}

export interface AIPersonalityConfig {
  id: string;
  name: string;
  earlyBurst: number;
  lateBurst: number;
  stability: number;
  riskWhenBehind: number;
}

export interface EnvironmentEvent {
  type: EnvironmentType;
  startProgress: number;
  endProgress: number;
  speedMod: number;
}

export interface PlayerUpgrades {
  boat: number;
  crew: number;
  drum: number;
}

export interface RaceConfig {
  seed: number;
  trackLength: number;
  bpm: number;
  raceDurationMs: number;
  opponents: AIPersonalityConfig[];
  clutchProgressThreshold: number;
  playerUpgrades?: PlayerUpgrades;
}

export interface BoatState {
  id: string;
  progress: number;
  speed: number;
  sync: number;
  stamina: number;
  isPlayer: boolean;
  finished: boolean;
  finishFrame?: number;
  personalityId?: string;
}

export interface RaceState {
  frame: number;
  elapsedMs: number;
  phase: RacePhase;
  boats: BoatState[];
  perfectCount: number;
  goodCount: number;
  missCount: number;
  clutchAvailable: boolean;
  clutchAttempted: boolean;
  clutchSuccess: boolean;
  clutchTaps: number;
  boostFramesRemaining: number;
  penaltyFramesRemaining: number;
  environment: EnvironmentEvent[];
  recentSyncSamples: number[];
}

export type RaceEvent =
  | { type: 'CLUTCH_AVAILABLE' }
  | { type: 'CLUTCH_SUCCESS' }
  | { type: 'CLUTCH_FAILED' }
  | { type: 'BOAT_FINISHED'; boatId: string; rank: number }
  | { type: 'RACE_FINISHED' }
  | { type: 'CAPSIZE_PENALTY'; boatId: string }
  | { type: 'JUDGE'; result: JudgeResult };

export interface RaceTickOutput {
  state: RaceState;
  events: RaceEvent[];
}

export interface ReplayPayload {
  version: number;
  seed: number;
  configHash: string;
  inputs: TapEvent[];
  checksum: string;
}

export interface LeaderboardSubmitInfo {
  submitted: boolean;
  accepted?: boolean;
  dailyRank?: number;
  score?: number;
  messageKey?: string;
  messageParams?: Record<string, string | number>;
}

export interface RaceResult {
  rank: number;
  totalBoats: number;
  perfectRate: number;
  syncAvg: number;
  durationMs: number;
  clutchSuccess: boolean;
  replay: ReplayPayload;
  leaderboard?: LeaderboardSubmitInfo;
}
