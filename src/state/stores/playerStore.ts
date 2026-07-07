import type { PlayerProfile } from '@/types/player.types';
import { loadOrCreateProfile, createStorage } from '@/services/storage/IndexedDBStore';

let profile: PlayerProfile | null = null;

export const playerStore = {
  async init(): Promise<PlayerProfile> {
    profile = await loadOrCreateProfile();
    return profile;
  },

  get(): PlayerProfile {
    if (!profile) throw new Error('playerStore not initialized');
    return profile;
  },

  async update(mutator: (p: PlayerProfile) => PlayerProfile): Promise<PlayerProfile> {
    if (!profile) throw new Error('playerStore not initialized');
    profile = mutator(profile);
    const storage = await createStorage();
    await storage.saveProfile(profile);
    return profile;
  },

  async mergeRemote(remote: Record<string, unknown>): Promise<void> {
    if (!profile) return;
    profile = {
      ...profile,
      ...(remote as Partial<PlayerProfile>),
      story: {
        ...profile.story,
        ...((remote.story as PlayerProfile['story']) ?? {}),
      },
      upgrades: {
        ...profile.upgrades,
        ...((remote.upgrades as PlayerProfile['upgrades']) ?? {}),
      },
      stats: {
        ...profile.stats,
        ...((remote.stats as PlayerProfile['stats']) ?? {}),
      },
      inventory: {
        ...profile.inventory,
        ...((remote.inventory as PlayerProfile['inventory']) ?? {}),
      },
      lastSyncAt: Date.now(),
    };
    const storage = await createStorage();
    await storage.saveProfile(profile);
  },

  async recordRaceResult(
    rank: number,
    perfectRate: number,
    raceKey?: string,
  ): Promise<void> {
    await this.update((p) => {
      const completedRaces = raceKey
        ? [...new Set([...p.story.completedRaces, raceKey])]
        : p.story.completedRaces;

      let currentChapter = p.story.currentChapter;
      if (raceKey?.startsWith('story-') && rank === 1) {
        const ch = Number(raceKey.replace('story-', ''));
        if (ch >= currentChapter) currentChapter = Math.min(5, ch + 1);
      }

      return {
        ...p,
        story: { currentChapter, completedRaces },
        stats: {
          totalRaces: p.stats.totalRaces + 1,
          wins: p.stats.wins + (rank === 1 ? 1 : 0),
          bestPerfectRate: Math.max(p.stats.bestPerfectRate, perfectRate),
        },
      };
    });
  },

  isChapterUnlocked(chapterId: number): boolean {
    const p = this.get();
    return chapterId <= p.story.currentChapter;
  },

  isChapterCompleted(chapterId: number): boolean {
    return this.get().story.completedRaces.includes(`story-${chapterId}`);
  },
};
