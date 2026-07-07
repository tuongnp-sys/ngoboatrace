import { describe, it, expect } from 'vitest';
import { getFinishRank, getRankColor, getRankLabel } from '@/game/utils/finishRank';
import type { BoatState } from '@/types/race.types';

describe('finishRank', () => {
  const boats: BoatState[] = [
    { id: 'a', progress: 1, speed: 0, sync: 50, stamina: 50, isPlayer: false, finished: true, finishFrame: 100 },
    { id: 'b', progress: 1, speed: 0, sync: 50, stamina: 50, isPlayer: true, finished: true, finishFrame: 80 },
    { id: 'c', progress: 0.5, speed: 0.01, sync: 50, stamina: 50, isPlayer: false, finished: false },
  ];

  it('ranks by finishFrame', () => {
    expect(getFinishRank('b', boats)).toBe(1);
    expect(getFinishRank('a', boats)).toBe(2);
    expect(getFinishRank('c', boats)).toBeNull();
  });

  it('returns colors and labels', () => {
    expect(getRankColor(1)).toBe('#ffd700');
    expect(getRankLabel(1)).toContain('1');
    expect(getRankLabel(4)).toBe('4️⃣');
  });
});
