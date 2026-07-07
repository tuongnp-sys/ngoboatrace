import { GAME_CONFIG } from '@/config/game.config';
import type { EnvironmentEvent, EnvironmentType } from '@/types/race.types';
import { SeededRandom } from '@/utils/seededRandom';

const ENV_TEMPLATES: Record<
  EnvironmentType,
  { speedMod: number; startRange: [number, number]; duration: number }
> = {
  calm: { speedMod: 0, startRange: [0, 0], duration: 0 },
  headwind: { speedMod: -0.1, startRange: [0.2, 0.5], duration: 0.25 },
  tailwind: { speedMod: 0.05, startRange: [0.1, 0.4], duration: 0.2 },
  shallow: { speedMod: -0.05, startRange: [0.35, 0.65], duration: 0.15 },
  rain: { speedMod: -0.03, startRange: [0.15, 0.55], duration: 0.3 },
};

export function generateEnvironment(seed: number, enabled: boolean): EnvironmentEvent[] {
  if (!enabled) {
    return [{ type: 'calm', startProgress: 0, endProgress: 1, speedMod: 0 }];
  }

  const rng = new SeededRandom(seed);
  const types: EnvironmentType[] = ['headwind', 'tailwind', 'shallow', 'rain'];
  const chosen = rng.pick(types);
  const template = ENV_TEMPLATES[chosen];
  const start =
    template.startRange[0] +
    rng.next() * (template.startRange[1] - template.startRange[0]);

  return [
    { type: 'calm', startProgress: 0, endProgress: start, speedMod: 0 },
    {
      type: chosen,
      startProgress: start,
      endProgress: Math.min(1, start + template.duration),
      speedMod: template.speedMod,
    },
    {
      type: 'calm',
      startProgress: Math.min(1, start + template.duration),
      endProgress: 1,
      speedMod: 0,
    },
  ];
}

export function getEnvironmentModAt(
  events: EnvironmentEvent[],
  progress: number,
): number {
  for (const event of events) {
    if (progress >= event.startProgress && progress < event.endProgress) {
      return event.speedMod;
    }
  }
  return 0;
}

export function isRainActive(events: EnvironmentEvent[], progress: number): boolean {
  return events.some(
    (e) =>
      e.type === 'rain' &&
      progress >= e.startProgress &&
      progress < e.endProgress,
  );
}

export function isShallowActive(events: EnvironmentEvent[], progress: number): boolean {
  return events.some(
    (e) =>
      e.type === 'shallow' &&
      progress >= e.startProgress &&
      progress < e.endProgress,
  );
}

export function computeSpeed(params: {
  sync: number;
  perfectRate: number;
  stamina: number;
  envMod: number;
  boostActive: boolean;
  boatUpgrade: number;
  baseSpeed?: number;
}): number {
  const base = params.baseSpeed ?? GAME_CONFIG.BASE_SPEED;
  const boatBonus = params.boatUpgrade * GAME_CONFIG.UPGRADE_BOAT_BONUS;
  const staminaPenalty =
    params.stamina < GAME_CONFIG.STAMINA_LOW_THRESHOLD ? 0.00015 : 0;

  let speed =
    base +
    boatBonus +
    (params.sync / 100) * GAME_CONFIG.SYNC_SPEED_WEIGHT * base * 10 +
    params.perfectRate * GAME_CONFIG.PERFECT_RATE_WEIGHT * base * 10 -
    staminaPenalty +
    params.envMod * base;

  if (params.boostActive) {
    speed *= GAME_CONFIG.BOOST_MULTIPLIER;
  }

  return Math.max(base * 0.3, speed);
}

export function penaltyFramesFromMs(ms: number): number {
  return Math.ceil(ms / GAME_CONFIG.TICK_MS);
}

export function boostFramesFromMs(ms: number): number {
  return Math.ceil(ms / GAME_CONFIG.TICK_MS);
}
