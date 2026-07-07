import { GAME_CONFIG } from '@/config/game.config';
import type { AIPersonalityConfig } from '@/types/race.types';
import { SeededRandom } from '@/utils/seededRandom';
import { getPersonalityPhaseModifier } from './AIPersonality';

export interface AIComputeParams {
  personality: AIPersonalityConfig;
  progress: number;
  raceProgress: number;
  playerProgress: number;
  frame: number;
  totalFrames: number;
}

export class AIController {
  private rng: SeededRandom;

  constructor(_opponents: AIPersonalityConfig[], seed: number) {
    this.rng = new SeededRandom(seed + 7919);
  }

  computeSpeed(params: AIComputeParams): number {
    const raceProgress = params.frame / Math.max(1, params.totalFrames);
    const phaseMod = getPersonalityPhaseModifier(params.personality, raceProgress);

    const behind = params.playerProgress > params.progress;
    const riskBoost = behind
      ? params.personality.riskWhenBehind * 0.0002
      : 0;

    const stabilityNoise = (this.rng.next() - 0.5) * (1 - params.personality.stability) * 0.0003;

    const baseRate =
      GAME_CONFIG.AI_BASE_PERFECT_RATE * phaseMod + params.personality.stability * 0.1;

    const effectiveRate = Math.min(0.92, baseRate + riskBoost * 1000);
    const sync = effectiveRate * 100;

    return (
      GAME_CONFIG.BASE_SPEED +
      (sync / 100) * GAME_CONFIG.SYNC_SPEED_WEIGHT * GAME_CONFIG.BASE_SPEED * 10 +
      effectiveRate * GAME_CONFIG.PERFECT_RATE_WEIGHT * GAME_CONFIG.BASE_SPEED * 10 +
      stabilityNoise
    );
  }
}
