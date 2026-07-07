import { DAILY_MAX_MISSES, getDailySeed } from '../../src/config/daily.config.js';
import { GAME_CONFIG } from '../../src/config/game.config.js';
import {
  buildRaceConfigFromMeta,
  validateScoreSubmission,
  type RaceConfigMeta,
} from '../../src/core/scoring/ScoreValidator.js';
import type { ReplayPayload } from '../../src/types/race.types.js';
import { todayKey } from './store.js';

export interface SubmitBody {
  mode: string;
  seed: number;
  rank: number;
  totalBoats: number;
  perfectRate: number;
  replay: ReplayPayload;
  raceConfig: RaceConfigMeta;
  displayName?: string;
}

export function validateDailySubmit(body: SubmitBody): ReturnType<typeof validateScoreSubmission> {
  const date = todayKey();
  const expectedSeed = getDailySeed(date);

  if (body.mode !== 'daily') {
    return { valid: false, code: 'NOT_LEADERBOARD_MODE', message: 'Only daily mode counts for leaderboard' };
  }

  if (body.seed !== expectedSeed) {
    return { valid: false, code: 'SEED_MISMATCH', message: 'Not today\'s daily seed' };
  }

  if (body.raceConfig.seed !== expectedSeed) {
    return { valid: false, code: 'SEED_MISMATCH', message: 'Race config seed mismatch' };
  }

  if (body.raceConfig.raceDurationMs !== GAME_CONFIG.QUICK_RACE_DURATION_MS) {
    return {
      valid: false,
      code: 'CONFIG_MISMATCH',
      message: 'Invalid race duration for daily',
    };
  }

  return validateScoreSubmission(
    body.raceConfig,
    body.replay,
    {
      rank: body.rank,
      totalBoats: body.totalBoats,
      perfectRate: body.perfectRate,
    },
    { maxMisses: DAILY_MAX_MISSES, environmentEnabled: body.raceConfig.environmentEnabled },
  );
}

export { buildRaceConfigFromMeta };
