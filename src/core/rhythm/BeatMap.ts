import { GAME_CONFIG } from '@/config/game.config';
import type { Beat } from '@/types/race.types';

export function generateBeatMap(bpm: number, durationMs: number): Beat[] {
  const intervalMs = 60_000 / bpm;
  const beats: Beat[] = [];
  let timeMs = 0;
  let index = 0;

  while (timeMs <= durationMs) {
    beats.push({ timeMs, index });
    index += 1;
    timeMs += intervalMs;
  }

  return beats;
}

export function getBeatIntervalMs(bpm: number): number {
  return 60_000 / bpm;
}

/** Vị trí trong nhịp hiện tại: 0 → 1 */
export function getBeatPhase(elapsedMs: number, bpm: number): number {
  const beatMs = getBeatIntervalMs(bpm);
  if (beatMs <= 0) return 0;
  return (elapsedMs % beatMs) / beatMs;
}

/** Giá trị sóng chèo đồng bộ BPM (−1 → 1) */
export function getBeatStroke(elapsedMs: number, bpm: number, amplitude = 1): number {
  const phase = getBeatPhase(elapsedMs, bpm);
  return Math.sin(phase * Math.PI * 2) * amplitude;
}

/** Có vừa qua ranh giới nhịp mới không (dùng cho trống / HUD pulse) */
export function crossedBeatBoundary(prevMs: number, currMs: number, bpm: number): boolean {
  const beatMs = getBeatIntervalMs(bpm);
  if (beatMs <= 0) return false;
  return Math.floor(currMs / beatMs) > Math.floor(prevMs / beatMs);
}

export function findNearestBeat(beats: Beat[], timeMs: number): Beat | null {
  if (beats.length === 0) return null;

  let nearest = beats[0]!;
  let minDiff = Math.abs(timeMs - nearest.timeMs);

  for (const beat of beats) {
    const diff = Math.abs(timeMs - beat.timeMs);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = beat;
    }
  }

  return nearest;
}

export function getBeatTimingOffset(beats: Beat[], timeMs: number): number {
  const nearest = findNearestBeat(beats, timeMs);
  if (!nearest) return Infinity;
  return Math.abs(timeMs - nearest.timeMs);
}

/** Rain shifts effective beat timing slightly. */
export function applyRainOffset(offsetMs: number, rainActive: boolean, frame: number): number {
  if (!rainActive) return offsetMs;
  const wobble = Math.sin(frame * 0.1) * (GAME_CONFIG.GOOD_WINDOW_MS * 0.15);
  return Math.max(0, offsetMs - Math.abs(wobble) * 0.5);
}
