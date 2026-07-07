import { env } from '@/config/env';
import { apiClient } from '@/services/network/ApiClient';
import { authService } from '@/services/auth/AuthService';
import { offlineDetector } from '@/services/network/OfflineDetector';
import { syncQueue } from '@/services/sync/SyncQueue';
import { playerStore } from '@/state/stores/playerStore';
import { gameEvents } from '@/state/events';
import type {
  RaceConfigSubmitMeta,
  SubmitScorePayload,
  SubmitScoreResponse,
} from '@/types/api.types';
import type { LeaderboardSubmitInfo, RaceResult } from '@/types/race.types';

export class SyncManager {
  async init(): Promise<void> {
    if (!env.features.cloudSave && !env.features.onlineLeaderboard) return;

    offlineDetector.onChange((online) => {
      if (online) void this.flush();
    });

    if (!offlineDetector.isOnline()) return;

    try {
      await authService.ensureGuest(playerStore.get().displayName);
      await this.pullCloudSave();
      await this.flush();
    } catch (err) {
      console.warn('[SyncManager] init skipped:', err);
    }
  }

  async saveProgress(): Promise<void> {
    if (!env.features.cloudSave) return;
    const profile = playerStore.get();
    const payload = { ...profile, displayName: profile.displayName };

    if (!offlineDetector.isOnline()) {
      await syncQueue.enqueue({ type: 'SAVE_PROGRESS', payload });
      return;
    }

    await apiClient.put('/player/me', { profile: payload });
  }

  async submitScore(
    result: RaceResult,
    mode: SubmitScorePayload['mode'],
    raceConfig: RaceConfigSubmitMeta,
  ): Promise<LeaderboardSubmitInfo> {
    if (!env.features.onlineLeaderboard) {
      return { submitted: false };
    }

    if (mode !== 'daily') {
      return { submitted: false, messageKey: 'leaderboard.dailyOnly' };
    }

    const profile = playerStore.get();
    const payload: SubmitScorePayload = {
      mode: 'daily',
      seed: result.replay.seed,
      rank: result.rank,
      totalBoats: result.totalBoats,
      perfectRate: result.perfectRate,
      replay: result.replay,
      raceConfig,
      displayName: profile.displayName,
    };

    if (!offlineDetector.isOnline()) {
      await syncQueue.enqueue({ type: 'SUBMIT_SCORE', payload });
      return {
        submitted: true,
        accepted: false,
        messageKey: 'leaderboard.offlineQueued',
      };
    }

    return this.postScore(payload);
  }

  private async postScore(payload: SubmitScorePayload): Promise<LeaderboardSubmitInfo> {
    const res = await apiClient.post<SubmitScoreResponse>('/scores', payload);

    if (!res.ok) {
      const messageKey =
        res.error.code === 'DUPLICATE_SUBMIT'
          ? 'leaderboard.duplicateSubmit'
          : 'leaderboard.submitError';
      return {
        submitted: true,
        accepted: false,
        messageKey,
        messageParams: { code: res.error.code },
      };
    }

    return {
      submitted: true,
      accepted: true,
      dailyRank: res.data.rank,
      score: res.data.score,
      messageKey: 'leaderboard.rank',
      messageParams: { rank: res.data.rank, score: res.data.score },
    };
  }

  async flush(): Promise<number> {
    if (!offlineDetector.isOnline()) return 0;

    try {
      await authService.ensureGuest();
      const pending = await syncQueue.peekAll();
      const remaining = [];

      for (const action of pending) {
        if (action.type === 'SAVE_PROGRESS') {
          const res = await apiClient.put('/player/me', { profile: action.payload });
          if (!res.ok && res.error.code === 'OFFLINE') {
            remaining.push(action);
            continue;
          }
        } else if (action.type === 'SUBMIT_SCORE') {
          const res = await apiClient.post('/scores', action.payload);
          if (!res.ok && res.error.code === 'OFFLINE') {
            remaining.push(action);
            continue;
          }
          if (!res.ok && res.error.code === 'DUPLICATE_SUBMIT') {
            continue;
          }
        }
      }

      await syncQueue.replaceAll(remaining);
      if (pending.length > remaining.length) {
        gameEvents.emit('sync:complete', { count: pending.length - remaining.length });
      }
      return pending.length - remaining.length;
    } catch (err) {
      console.warn('[SyncManager] flush failed:', err);
      return 0;
    }
  }

  private async pullCloudSave(): Promise<void> {
    if (!env.features.cloudSave) return;
    const res = await apiClient.get<{ profile: Record<string, unknown>; updatedAt: number }>(
      '/player/me',
    );
    if (!res.ok) return;

    const remote = res.data.profile;
    const local = playerStore.get();
    if (res.data.updatedAt > local.lastSyncAt && Object.keys(remote).length > 0) {
      await playerStore.mergeRemote(remote);
    }
  }
}

export const syncManager = new SyncManager();
