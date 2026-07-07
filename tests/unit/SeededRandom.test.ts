import { describe, it, expect } from 'vitest';
import { SeededRandom } from '@/utils/seededRandom';

describe('SeededRandom', () => {
  it('produces same sequence for same seed', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = new SeededRandom(1);
    const b = new SeededRandom(2);
    expect(a.next()).not.toBe(b.next());
  });

  it('nextInt stays within bounds', () => {
    const rng = new SeededRandom(99);
    for (let i = 0; i < 100; i++) {
      const n = rng.nextInt(5, 10);
      expect(n).toBeGreaterThanOrEqual(5);
      expect(n).toBeLessThanOrEqual(10);
    }
  });
});
