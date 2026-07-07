import { describe, it, expect } from 'vitest';
import { RaceSimulator, createDefaultRaceConfig } from '@/core/race/RaceSimulator';
import { TEAMS } from '@/config/teams.config';
import { encodeReplay, replayRace, verifyReplayChecksum } from '@/core/scoring/ReplayEncoder';
import { GAME_CONFIG } from '@/config/game.config';
import { getBeatIntervalMs } from '@/core/rhythm/BeatMap';
import type { TapEvent } from '@/types/race.types';

describe('ReplayEncoder', () => {
  const config = createDefaultRaceConfig(999, ['tra-vinh'], TEAMS);

  it('encodes and verifies checksum', () => {
    const inputs: TapEvent[] = [
      { frame: 10, type: 'tap' },
      { frame: 20, type: 'tap' },
    ];
    const replay = encodeReplay(config, inputs);
    expect(verifyReplayChecksum(replay)).toBe(true);
    expect(replay.version).toBe(GAME_CONFIG.REPLAY_VERSION);
  });

  it('re-simulate produces same rank and perfect rate', () => {
    const sim = new RaceSimulator(config, false);
    const beatFrames = Math.round(getBeatIntervalMs(config.bpm) / GAME_CONFIG.TICK_MS);

    sim.runToCompletion((frame) => {
      if (frame % beatFrames === 0) {
        return [{ frame, type: 'tap' }];
      }
      return [];
    });

    const inputs = sim.getInputs();
    const replay = encodeReplay(config, inputs);
    const originalRank = sim.getPlayerRank();
    const originalPerfect =
      sim.getState().perfectCount /
      Math.max(
        1,
        sim.getState().perfectCount +
          sim.getState().goodCount +
          sim.getState().missCount,
      );

    const replayed = replayRace(config, replay, false);
    expect(replayed.rank).toBe(originalRank);
    expect(replayed.perfectRate).toBeCloseTo(originalPerfect, 5);
  });

  it('rejects tampered checksum', () => {
    const replay = encodeReplay(config, [{ frame: 1, type: 'tap' }]);
    replay.checksum = 'deadbeef';
    expect(verifyReplayChecksum(replay)).toBe(false);
  });
});
