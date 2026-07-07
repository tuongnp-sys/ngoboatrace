import type { PlayerProfile } from '@/types/player.types';

export interface StorageAdapter {
  getProfile(): Promise<PlayerProfile | null>;
  saveProfile(profile: PlayerProfile): Promise<void>;
  clear(): Promise<void>;
}
