import { describe, it, expect } from 'vitest';
import {
  crossedBeatBoundary,
  generateBeatMap,
  getBeatIntervalMs,
  getBeatPhase,
  getBeatStroke,
  getBeatTimingOffset,
} from '@/core/rhythm/BeatMap';

describe('BeatMap', () => {
  it('generates beats at correct interval for 120 BPM', () => {
    const interval = getBeatIntervalMs(120);
    expect(interval).toBe(500);

    const beats = generateBeatMap(120, 2000);
    expect(beats.length).toBeGreaterThan(3);
    expect(beats[1]!.timeMs - beats[0]!.timeMs).toBe(500);
  });

  it('finds timing offset from nearest beat', () => {
    const beats = generateBeatMap(120, 5000);
    expect(getBeatTimingOffset(beats, 500)).toBe(0);
    expect(getBeatTimingOffset(beats, 530)).toBe(30);
  });

  it('syncs stroke phase to BPM', () => {
    expect(getBeatPhase(0, 120)).toBe(0);
    expect(getBeatPhase(250, 120)).toBe(0.5);
    expect(getBeatStroke(250, 120)).toBeCloseTo(0, 5);
    expect(getBeatStroke(375, 120)).toBeCloseTo(-1, 5);
    expect(crossedBeatBoundary(400, 600, 120)).toBe(true);
    expect(crossedBeatBoundary(400, 499, 120)).toBe(false);
  });
});
