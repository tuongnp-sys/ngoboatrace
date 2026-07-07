import type { RaceState } from '@/types/race.types';

export function calculatePerfectRate(state: RaceState): number {
  const total = state.perfectCount + state.goodCount + state.missCount;
  if (total === 0) return 0;
  return state.perfectCount / total;
}

export function calculateSyncAverage(samples: number[]): number {
  if (samples.length === 0) return 0;
  return samples.reduce((a, b) => a + b, 0) / samples.length;
}

export function calculateRaceScore(state: RaceState, rank: number, totalBoats: number): number {
  const perfectRate = calculatePerfectRate(state);
  const syncAvg = calculateSyncAverage(state.recentSyncSamples);
  const rankBonus = (totalBoats - rank + 1) * 100;
  const clutchBonus = state.clutchSuccess ? 200 : 0;

  return Math.round(perfectRate * 500 + syncAvg * 3 + rankBonus + clutchBonus);
}
