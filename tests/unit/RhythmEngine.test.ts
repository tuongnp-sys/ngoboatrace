import { describe, it, expect } from 'vitest';
import { RhythmEngine, createRhythmState } from '@/core/rhythm/RhythmEngine';
import type { TapEvent } from '@/types/race.types';

describe('RhythmEngine', () => {
  it('increases sync on perfect tap', () => {
    const engine = new RhythmEngine(120, 10_000);
    const state = createRhythmState();
    const inputs: TapEvent[] = [{ frame: 1, type: 'tap' }];

    const result = engine.processInputs(state, inputs, 500, 30, false);
    expect(result.state.perfectCount + result.state.goodCount).toBeGreaterThanOrEqual(1);
    expect(result.state.sync).toBeGreaterThanOrEqual(state.sync);
  });

  it('applies hold when sync is high enough', () => {
    const engine = new RhythmEngine(120, 10_000);
    const state = { ...createRhythmState(), sync: 70, stamina: 50 };
    const inputs: TapEvent[] = [{ frame: 1, type: 'hold', holdDurationMs: 1000 }];

    const result = engine.processInputs(state, inputs, 1000, 60, false);
    expect(result.state.sync).toBeGreaterThan(state.sync);
    expect(result.state.stamina).toBeGreaterThan(state.stamina);
  });
});
