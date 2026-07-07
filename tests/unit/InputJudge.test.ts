import { describe, it, expect } from 'vitest';
import { judgeInput } from '@/core/rhythm/InputJudge';
import { GAME_CONFIG } from '@/config/game.config';

describe('InputJudge', () => {
  it('returns perfect within perfect window', () => {
    expect(judgeInput({ offsetMs: 30 })).toBe('perfect');
    expect(judgeInput({ offsetMs: GAME_CONFIG.PERFECT_WINDOW_MS })).toBe('perfect');
  });

  it('returns good within good window', () => {
    expect(judgeInput({ offsetMs: 80 })).toBe('good');
    expect(judgeInput({ offsetMs: GAME_CONFIG.GOOD_WINDOW_MS })).toBe('good');
  });

  it('returns miss outside good window', () => {
    expect(judgeInput({ offsetMs: 200 })).toBe('miss');
  });

  it('narrows perfect window when stamina low', () => {
    const result = judgeInput({ offsetMs: 45, staminaLow: true });
    expect(result).toBe('good');
  });
});
