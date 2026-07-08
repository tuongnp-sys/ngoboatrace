export interface PlayerProfile {
  id: string;
  displayName: string;
  teamId: string;
  createdAt: number;
  lastSyncAt: number;
  tutorialCompleted: boolean;
  story: {
    currentChapter: number;
    completedRaces: string[];
  };
  upgrades: {
    boat: number;
    crew: number;
    drum: number;
  };
  inventory: {
    skins: string[];
    unlockedTeams: string[];
  };
  stats: {
    totalRaces: number;
    wins: number;
    bestPerfectRate: number;
  };
}

export function createDefaultProfile(id: string, displayName: string): PlayerProfile {
  return {
    id,
    displayName,
    teamId: 'soc-trang',
    createdAt: Date.now(),
    lastSyncAt: Date.now(),
    tutorialCompleted: false,
    story: { currentChapter: 1, completedRaces: [] },
    upgrades: { boat: 0, crew: 0, drum: 0 },
    inventory: { skins: [], unlockedTeams: ['soc-trang'] },
    stats: { totalRaces: 0, wins: 0, bestPerfectRate: 0 },
  };
}
