import { describe, it, expect } from 'vitest';
import { generateEnvironment } from '@/core/race/EnvironmentModifier';
import { SeededRandom } from '@/utils/seededRandom';

describe('EnvironmentModifier', () => {
  it('returns calm only when disabled', () => {
    const env = generateEnvironment(123, false);
    expect(env).toHaveLength(1);
    expect(env[0]!.type).toBe('calm');
  });

  it('generates deterministic environment for same seed', () => {
    const a = generateEnvironment(777, true);
    const b = generateEnvironment(777, true);
    expect(a.map((e) => e.type)).toEqual(b.map((e) => e.type));
    expect(a.map((e) => e.speedMod)).toEqual(b.map((e) => e.speedMod));
  });

  it('differs across seeds', () => {
    const seeds = new Set<string>();
    for (let s = 1; s <= 20; s++) {
      const env = generateEnvironment(s, true);
      seeds.add(env.map((e) => e.type).join(','));
    }
    expect(seeds.size).toBeGreaterThan(1);
  });
});

describe('SeededRandom pick', () => {
  it('picks from array', () => {
    const rng = new SeededRandom(5);
    const item = rng.pick(['a', 'b', 'c']);
    expect(['a', 'b', 'c']).toContain(item);
  });
});
