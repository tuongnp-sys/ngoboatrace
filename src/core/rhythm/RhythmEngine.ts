import { GAME_CONFIG } from '@/config/game.config';
import type { JudgeResult, TapEvent } from '@/types/race.types';
import { generateBeatMap, getBeatTimingOffset } from './BeatMap';
import { judgeInput } from './InputJudge';

export interface RhythmState {
  sync: number;
  stamina: number;
  perfectCount: number;
  goodCount: number;
  missCount: number;
  judgedBeatIndices: Set<number>;
}

export interface RhythmTickResult {
  state: RhythmState;
  results: JudgeResult[];
  events: Array<{ type: 'JUDGE'; result: JudgeResult }>;
}

export function createRhythmState(
  upgrades?: { crew: number; drum: number },
): RhythmState {
  const crewBonus = (upgrades?.crew ?? 0) * GAME_CONFIG.UPGRADE_CREW_STAMINA;
  return {
    sync: GAME_CONFIG.SYNC_INITIAL,
    stamina: GAME_CONFIG.STAMINA_INITIAL + crewBonus,
    perfectCount: 0,
    goodCount: 0,
    missCount: 0,
    judgedBeatIndices: new Set(),
  };
}

export class RhythmEngine {
  private beats;
  private drumBonus: number;

  constructor(bpm: number, durationMs: number, drumLevel = 0) {
    this.beats = generateBeatMap(bpm, durationMs);
    this.drumBonus = drumLevel * 0.05;
  }

  processInputs(
    state: RhythmState,
    inputs: TapEvent[],
    elapsedMs: number,
    frame: number,
    rainActive: boolean,
  ): RhythmTickResult {
    const results: JudgeResult[] = [];
    const events: Array<{ type: 'JUDGE'; result: JudgeResult }> = [];
    let next = { ...state, judgedBeatIndices: new Set(state.judgedBeatIndices) };

    for (const input of inputs) {
      if (input.type === 'tap') {
        const offset = getBeatTimingOffset(this.beats, elapsedMs);
        const nearest = this.beats.find((b) => Math.abs(b.timeMs - elapsedMs) <= offset);
        if (nearest && next.judgedBeatIndices.has(nearest.index)) {
          continue;
        }

        const staminaLow = next.stamina < GAME_CONFIG.STAMINA_LOW_THRESHOLD;
        let result = judgeInput({ offsetMs: offset, rainActive, frame, staminaLow });

        if (result === 'good' && this.drumBonus > 0 && offset <= GAME_CONFIG.GOOD_WINDOW_MS * (1 - this.drumBonus)) {
          result = 'perfect';
        }

        results.push(result);
        events.push({ type: 'JUDGE', result });
        next = this.applyJudgeResult(next, result, nearest?.index);
      } else if (input.type === 'hold' && (input.holdDurationMs ?? 0) >= 1000) {
        next = this.applyHold(next);
      }
    }

    return { state: next, results, events };
  }

  private applyJudgeResult(
    state: RhythmState,
    result: JudgeResult,
    beatIndex?: number,
  ): RhythmState {
    const next = { ...state, judgedBeatIndices: new Set(state.judgedBeatIndices) };
    if (beatIndex !== undefined) {
      next.judgedBeatIndices.add(beatIndex);
    }

    switch (result) {
      case 'perfect':
        next.perfectCount += 1;
        next.sync = clamp(
          next.sync + GAME_CONFIG.SYNC_PERFECT_GAIN,
          GAME_CONFIG.SYNC_MIN,
          GAME_CONFIG.SYNC_MAX,
        );
        next.stamina = Math.max(0, next.stamina - GAME_CONFIG.STAMINA_PERFECT_COST);
        break;
      case 'good':
        next.goodCount += 1;
        next.sync = clamp(
          next.sync + GAME_CONFIG.SYNC_GOOD_GAIN,
          GAME_CONFIG.SYNC_MIN,
          GAME_CONFIG.SYNC_MAX,
        );
        next.stamina = Math.max(0, next.stamina - GAME_CONFIG.STAMINA_GOOD_COST);
        break;
      case 'miss':
        next.missCount += 1;
        next.sync = clamp(
          next.sync - GAME_CONFIG.SYNC_MISS_LOSS,
          GAME_CONFIG.SYNC_MIN,
          GAME_CONFIG.SYNC_MAX,
        );
        next.stamina = Math.max(0, next.stamina - GAME_CONFIG.STAMINA_MISS_COST);
        break;
    }

    return next;
  }

  private applyHold(state: RhythmState): RhythmState {
    if (state.sync < 60) return state;
    return {
      ...state,
      sync: clamp(state.sync + GAME_CONFIG.SYNC_HOLD_GAIN, GAME_CONFIG.SYNC_MIN, GAME_CONFIG.SYNC_MAX),
      stamina: clamp(
        state.stamina + GAME_CONFIG.STAMINA_HOLD_RECOVERY,
        0,
        GAME_CONFIG.STAMINA_INITIAL,
      ),
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
