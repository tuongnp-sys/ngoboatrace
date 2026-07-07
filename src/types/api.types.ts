export interface ApiErrorBody {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export interface ApiSuccessBody<T> {
  ok: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccessBody<T> | ApiErrorBody;

export interface GuestAuthResponse {
  token: string;
  playerId: string;
  displayName: string;
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  score: number;
  perfectRate: number;
  mode?: string;
}

export interface DailyChallenge {
  date: string;
  seed: number;
  condition: string;
  maxMisses: number;
}

import type { PlayerUpgrades, ReplayPayload } from '@/types/race.types';

export interface RaceConfigSubmitMeta {
  seed: number;
  opponentIds: string[];
  raceDurationMs: number;
  environmentEnabled: boolean;
  playerUpgrades?: PlayerUpgrades;
}

export interface SubmitScorePayload {
  mode: 'quick' | 'story' | 'daily';
  seed: number;
  rank: number;
  totalBoats: number;
  perfectRate: number;
  replay: ReplayPayload;
  raceConfig: RaceConfigSubmitMeta;
  displayName?: string;
}

export interface SubmitScoreResponse {
  score: number;
  rank: number;
  validated: boolean;
}
export type SyncAction =
  | { type: 'SAVE_PROGRESS'; payload: Record<string, unknown>; createdAt: number }
  | { type: 'SUBMIT_SCORE'; payload: SubmitScorePayload; createdAt: number };
