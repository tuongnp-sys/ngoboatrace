export type DifficultyTier = {
  id: string;
  aiPerfectRateBonus: number;
  playerSyncPenalty: number;
}

export const DIFFICULTY_TIERS: DifficultyTier[] = [
  { id: 'village', aiPerfectRateBonus: -0.15, playerSyncPenalty: 0 },
  { id: 'district', aiPerfectRateBonus: -0.05, playerSyncPenalty: 0 },
  { id: 'provincial', aiPerfectRateBonus: 0.05, playerSyncPenalty: 0 },
  { id: 'festival', aiPerfectRateBonus: 0.12, playerSyncPenalty: 5 },
];

export function getDifficultyTier(chapterId: number): DifficultyTier {
  if (chapterId <= 1) return DIFFICULTY_TIERS[0]!;
  if (chapterId <= 2) return DIFFICULTY_TIERS[1]!;
  if (chapterId <= 4) return DIFFICULTY_TIERS[2]!;
  return DIFFICULTY_TIERS[3]!;
}

export class DifficultyScaler {
  static getAIPerfectRate(baseRate: number, chapterId: number): number {
    const tier = getDifficultyTier(chapterId);
    return Math.min(0.95, Math.max(0.4, baseRate + tier.aiPerfectRateBonus));
  }
}
