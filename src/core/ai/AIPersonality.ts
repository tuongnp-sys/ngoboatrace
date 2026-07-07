import type { AIPersonalityConfig } from '@/types/race.types';

export type AIPersonality = AIPersonalityConfig;

export function getPersonalityPhaseModifier(
  personality: AIPersonality,
  raceProgress: number,
): number {
  if (raceProgress < 0.33) {
    return personality.earlyBurst;
  }
  if (raceProgress > 0.66) {
    return personality.lateBurst;
  }
  return (personality.earlyBurst + personality.lateBurst) / 2;
}
