import { describe, it, expect } from 'vitest';
import { RaceSimulator, createDefaultRaceConfig } from '@/core/race/RaceSimulator';
import { TEAMS } from '@/config/teams.config';
import { GAME_CONFIG } from '@/config/game.config';
import type { TapEvent } from '@/types/race.types';
import { getBeatIntervalMs } from '@/core/rhythm/BeatMap';

describe('RaceSimulator', () => {
  const config = createDefaultRaceConfig(12345, ['tra-vinh', 'ca-mau'], TEAMS);

  it('runs 1000 ticks without crash', () => {
    const sim = new RaceSimulator(config, false);
    for (let i = 0; i < 1000; i++) {
      sim.tick([]);
      if (sim.getState().phase === 'finished') break;
    }
    expect(sim.getState().frame).toBeGreaterThan(0);
    expect(sim.getState().phase).toBe('finished');
  });

  it('finishes race when player taps on beats', () => {
    const sim = new RaceSimulator(config, false);
    const beatMs = getBeatIntervalMs(config.bpm);
    const beatFrames = Math.round(beatMs / GAME_CONFIG.TICK_MS);

    const state = sim.runToCompletion((frame) => {
      if (frame > 0 && frame % beatFrames === 0) {
        return [{ frame, type: 'tap' }];
      }
      return [];
    });

    expect(state.phase).toBe('finished');
    expect(state.perfectCount + state.goodCount).toBeGreaterThan(0);
  });

  it('tracks player rank', () => {
    const sim = new RaceSimulator(config, false);
    sim.runToCompletion(() => []);
    const rank = sim.getPlayerRank();
    expect(rank).toBeGreaterThanOrEqual(1);
    expect(rank).toBeLessThanOrEqual(config.opponents.length + 1);
  });

  it('emits CLUTCH_AVAILABLE near finish', () => {
    const sim = new RaceSimulator(config, false);
    const beatFrames = Math.round(getBeatIntervalMs(config.bpm) / GAME_CONFIG.TICK_MS);
    let clutchSeen = false;

    for (let i = 0; i < 5000; i++) {
      const inputs: TapEvent[] =
        i % beatFrames === 0 ? [{ frame: sim.getState().frame, type: 'tap' }] : [];
      const { events } = sim.tick(inputs);
      if (events.some((e) => e.type === 'CLUTCH_AVAILABLE')) {
        clutchSeen = true;
        break;
      }
    }

    expect(clutchSeen).toBe(true);
  });
});
