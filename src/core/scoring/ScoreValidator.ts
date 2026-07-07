import { GAME_CONFIG } from '@/config/game.config';
import { DAILY_MAX_MISSES } from '@/config/daily.config';
import { TEAMS } from '@/config/teams.config';
import { createDefaultRaceConfig } from '@/core/race/RaceSimulator';
import { hashRaceConfig, replayRace, verifyReplayChecksum } from '@/core/scoring/ReplayEncoder';
import type { PlayerUpgrades, RaceConfig, ReplayPayload } from '@/types/race.types';

export interface RaceConfigMeta {
  seed: number;
  opponentIds: string[];
  raceDurationMs: number;
  environmentEnabled: boolean;
  playerUpgrades?: PlayerUpgrades;
}

export interface ScoreClaim {
  rank: number;
  totalBoats: number;
  perfectRate: number;
}

export type ValidationResult =
  | {
      valid: true;
      rank: number;
      perfectRate: number;
      missCount: number;
      syncAvg: number;
    }
  | { valid: false; code: string; message: string };

const RANK_TOLERANCE = 0;
const PERFECT_RATE_TOLERANCE = 0.002;

export function buildRaceConfigFromMeta(meta: RaceConfigMeta): RaceConfig {
  const config = createDefaultRaceConfig(meta.seed, [...meta.opponentIds], TEAMS);
  config.raceDurationMs = meta.raceDurationMs;
  if (meta.playerUpgrades) {
    config.playerUpgrades = meta.playerUpgrades;
  }
  return config;
}

export function validateScoreSubmission(
  meta: RaceConfigMeta,
  replay: ReplayPayload,
  claim: ScoreClaim,
  options?: { maxMisses?: number; environmentEnabled?: boolean },
): ValidationResult {
  if (replay.version !== GAME_CONFIG.REPLAY_VERSION) {
    return { valid: false, code: 'UNSUPPORTED_REPLAY', message: 'Replay version not supported' };
  }

  if (!verifyReplayChecksum(replay)) {
    return { valid: false, code: 'INVALID_CHECKSUM', message: 'Replay checksum mismatch' };
  }

  if (replay.seed !== meta.seed) {
    return { valid: false, code: 'SEED_MISMATCH', message: 'Replay seed does not match race' };
  }

  const config = buildRaceConfigFromMeta(meta);
  if (hashRaceConfig(config) !== replay.configHash) {
    return { valid: false, code: 'CONFIG_MISMATCH', message: 'Race config does not match replay' };
  }

  const envEnabled = options?.environmentEnabled ?? meta.environmentEnabled;

  let replayed;
  try {
    replayed = replayRace(config, replay, envEnabled);
  } catch {
    return { valid: false, code: 'REPLAY_FAILED', message: 'Could not replay race' };
  }

  if (claim.totalBoats !== config.opponents.length + 1) {
    return {
      valid: false,
      code: 'BOAT_COUNT_MISMATCH',
      message: 'Invalid total boats',
    };
  }

  if (Math.abs(replayed.rank - claim.rank) > RANK_TOLERANCE) {
    return {
      valid: false,
      code: 'RANK_MISMATCH',
      message: `Claimed rank ${claim.rank} but replay gives ${replayed.rank}`,
    };
  }

  if (Math.abs(replayed.perfectRate - claim.perfectRate) > PERFECT_RATE_TOLERANCE) {
    return {
      valid: false,
      code: 'PERFECT_RATE_MISMATCH',
      message: 'Perfect rate does not match replay',
    };
  }

  const missCount = replayed.state.missCount;
  const maxMisses = options?.maxMisses ?? DAILY_MAX_MISSES;
  if (missCount > maxMisses) {
    return {
      valid: false,
      code: 'TOO_MANY_MISSES',
      message: `Miss count ${missCount} exceeds limit ${maxMisses}`,
    };
  }

  return {
    valid: true,
    rank: replayed.rank,
    perfectRate: replayed.perfectRate,
    missCount,
    syncAvg: replayed.syncAvg,
  };
}
