import { GAME_CONFIG } from '@/config/game.config';
import type { RaceConfig, ReplayPayload, TapEvent } from '@/types/race.types';
import { RaceSimulator } from '../race/RaceSimulator';
import { calculatePerfectRate, calculateSyncAverage } from './ScoreCalculator';
import { hashString } from '@/utils/seededRandom';

export function hashRaceConfig(config: RaceConfig): string {
  const key = JSON.stringify({
    seed: config.seed,
    trackLength: config.trackLength,
    bpm: config.bpm,
    raceDurationMs: config.raceDurationMs,
    opponents: config.opponents.map((o) => o.id),
    clutchProgressThreshold: config.clutchProgressThreshold,
    upgrades: config.playerUpgrades,
  });
  return hashString(key);
}

export function encodeReplay(
  config: RaceConfig,
  inputs: TapEvent[],
): ReplayPayload {
  const sortedInputs = [...inputs].sort((a, b) => a.frame - b.frame);
  const body = JSON.stringify(sortedInputs);
  const checksum = hashString(`${config.seed}:${body}`);

  return {
    version: GAME_CONFIG.REPLAY_VERSION,
    seed: config.seed,
    configHash: hashRaceConfig(config),
    inputs: sortedInputs,
    checksum,
  };
}

export function verifyReplayChecksum(replay: ReplayPayload): boolean {
  const body = JSON.stringify(replay.inputs);
  const expected = hashString(`${replay.seed}:${body}`);
  return expected === replay.checksum;
}

export function replayRace(
  config: RaceConfig,
  replay: ReplayPayload,
  environmentEnabled = true,
) {
  if (verifyReplayChecksum(replay) === false) {
    throw new Error('Invalid replay checksum');
  }
  if (hashRaceConfig(config) !== replay.configHash) {
    throw new Error('Config hash mismatch');
  }

  const inputsByFrame = new Map<number, TapEvent[]>();
  for (const input of replay.inputs) {
    const list = inputsByFrame.get(input.frame) ?? [];
    list.push(input);
    inputsByFrame.set(input.frame, list);
  }

  const sim = new RaceSimulator(config, environmentEnabled);
  const maxFrames = Math.ceil(config.raceDurationMs / GAME_CONFIG.TICK_MS) + 120;

  for (let f = 0; f < maxFrames; f++) {
    const inputs = inputsByFrame.get(sim.getState().frame) ?? [];
    sim.tick(inputs);
    if (sim.getState().phase === 'finished') break;
  }

  const state = sim.getState();
  const rank = sim.getPlayerRank();
  const perfectRate = calculatePerfectRate(state);
  const syncAvg = calculateSyncAverage(state.recentSyncSamples);

  return {
    state,
    rank,
    perfectRate,
    syncAvg,
    durationMs: state.elapsedMs,
    clutchSuccess: state.clutchSuccess,
  };
}
