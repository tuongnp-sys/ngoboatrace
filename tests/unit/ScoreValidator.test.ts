import { describe, it, expect } from 'vitest';
import { GAME_CONFIG } from '@/config/game.config';
import { DAILY_MAX_MISSES, DAILY_OPPONENT_IDS } from '@/config/daily.config';
import { RaceSimulator, createDefaultRaceConfig } from '@/core/race/RaceSimulator';
import { TEAMS } from '@/config/teams.config';
import { encodeReplay } from '@/core/scoring/ReplayEncoder';
import { buildRaceConfigFromMeta, validateScoreSubmission } from '@/core/scoring/ScoreValidator';
import { getBeatIntervalMs } from '@/core/rhythm/BeatMap';
import type { TapEvent } from '@/types/race.types';

describe('ScoreValidator', () => {
  const meta = {
    seed: 4242,
    opponentIds: [...DAILY_OPPONENT_IDS],
    raceDurationMs: GAME_CONFIG.QUICK_RACE_DURATION_MS,
    environmentEnabled: true,
    playerUpgrades: { boat: 0, crew: 0, drum: 0 },
  };

  function runDailyReplay(): {
    replay: ReturnType<typeof encodeReplay>;
    rank: number;
    perfectRate: number;
    totalBoats: number;
    missCount: number;
  } {
    const config = buildRaceConfigFromMeta(meta);
    const sim = new RaceSimulator(config, meta.environmentEnabled);
    const beatFrames = Math.round(getBeatIntervalMs(config.bpm) / GAME_CONFIG.TICK_MS);

    sim.runToCompletion((frame) => {
      if (frame % beatFrames === 0) {
        return [{ frame, type: 'tap' } as TapEvent];
      }
      return [];
    });

    const state = sim.getState();
    const total = state.perfectCount + state.goodCount + state.missCount;
    const perfectRate = total > 0 ? state.perfectCount / total : 0;

    return {
      replay: encodeReplay(config, sim.getInputs()),
      rank: sim.getPlayerRank(),
      perfectRate,
      totalBoats: state.boats.length,
      missCount: state.missCount,
    };
  }

  it('accepts valid replay matching claim', () => {
    const { replay, rank, perfectRate, totalBoats } = runDailyReplay();
    const result = validateScoreSubmission(meta, replay, { rank, perfectRate, totalBoats });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.rank).toBe(rank);
      expect(result.missCount).toBeLessThanOrEqual(DAILY_MAX_MISSES);
    }
  });

  it('rejects tampered rank', () => {
    const { replay, rank, perfectRate, totalBoats } = runDailyReplay();
    const result = validateScoreSubmission(meta, replay, {
      rank: 1,
      perfectRate,
      totalBoats,
    });
    if (rank !== 1) {
      expect(result.valid).toBe(false);
      if (!result.valid) expect(result.code).toBe('RANK_MISMATCH');
    }
  });

  it('rejects bad checksum', () => {
    const { replay, rank, perfectRate, totalBoats } = runDailyReplay();
    replay.checksum = 'bad';
    const result = validateScoreSubmission(meta, replay, { rank, perfectRate, totalBoats });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('INVALID_CHECKSUM');
  });

  it('rejects wrong seed in meta', () => {
    const config = createDefaultRaceConfig(999, ['tra-vinh'], TEAMS);
    const replay = encodeReplay(config, [{ frame: 1, type: 'tap' }]);
    const result = validateScoreSubmission(
      { ...meta, seed: 8888 },
      replay,
      { rank: 1, perfectRate: 1, totalBoats: 2 },
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('SEED_MISMATCH');
  });
});
