export { createDefaultProfile, type PlayerProfile } from '@/types/player.types';

export function applyUpgrade(
  profile: import('@/types/player.types').PlayerProfile,
  type: 'boat' | 'crew' | 'drum',
): import('@/types/player.types').PlayerProfile {
  const maxLevel = 5;
  const current = profile.upgrades[type];
  if (current >= maxLevel) return profile;

  return {
    ...profile,
    upgrades: {
      ...profile.upgrades,
      [type]: current + 1,
    },
  };
}

export function getUpgradeCost(type: 'boat' | 'crew' | 'drum', level: number): number {
  const base = { boat: 100, crew: 80, drum: 120 };
  return base[type] * (level + 1);
}
