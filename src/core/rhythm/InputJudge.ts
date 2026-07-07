import { GAME_CONFIG } from '@/config/game.config';
import type { JudgeResult } from '@/types/race.types';
import { applyRainOffset } from './BeatMap';

export interface JudgeInput {
  offsetMs: number;
  rainActive?: boolean;
  frame?: number;
  staminaLow?: boolean;
}

export function judgeInput(input: JudgeInput): JudgeResult {
  let windowPerfect = GAME_CONFIG.PERFECT_WINDOW_MS;
  const windowGood = GAME_CONFIG.GOOD_WINDOW_MS;

  if (input.staminaLow) {
    windowPerfect *= 0.7;
  }

  let offset = input.offsetMs;
  if (input.rainActive && input.frame !== undefined) {
    offset = applyRainOffset(offset, true, input.frame);
  }

  if (offset <= windowPerfect) return 'perfect';
  if (offset <= windowGood) return 'good';
  return 'miss';
}

export function judgeResultScore(result: JudgeResult): number {
  switch (result) {
    case 'perfect':
      return 3;
    case 'good':
      return 1;
    case 'miss':
      return 0;
  }
}
