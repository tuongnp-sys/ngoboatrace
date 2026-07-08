import { createDefaultProfile, type PlayerProfile } from '@/types/player.types';
import { getDefaultDisplayName } from '@/utils/displayName';
import type { StorageAdapter } from './StorageAdapter';
import { openDb, PROFILE_KEY, STORE_PLAYER } from './idb';

export class IndexedDBStore implements StorageAdapter {
  async getProfile(): Promise<PlayerProfile | null> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PLAYER, 'readonly');
      const store = tx.objectStore(STORE_PLAYER);
      const req = store.get(PROFILE_KEY);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve((req.result as PlayerProfile) ?? null);
    });
  }

  async saveProfile(profile: PlayerProfile): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PLAYER, 'readwrite');
      const store = tx.objectStore(STORE_PLAYER);
      const req = store.put({ ...profile, lastSyncAt: Date.now() }, PROFILE_KEY);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PLAYER, 'readwrite');
      const store = tx.objectStore(STORE_PLAYER);
      const req = store.clear();
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve();
    });
  }
}

export class LocalStorageFallback implements StorageAdapter {
  private key = 'ngoboatrace_profile';

  async getProfile(): Promise<PlayerProfile | null> {
    const raw = localStorage.getItem(this.key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PlayerProfile;
    } catch {
      return null;
    }
  }

  async saveProfile(profile: PlayerProfile): Promise<void> {
    localStorage.setItem(this.key, JSON.stringify({ ...profile, lastSyncAt: Date.now() }));
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.key);
  }
}

export async function createStorage(): Promise<StorageAdapter> {
  if (typeof indexedDB === 'undefined') {
    return new LocalStorageFallback();
  }
  try {
    const store = new IndexedDBStore();
    await store.getProfile();
    return store;
  } catch {
    return new LocalStorageFallback();
  }
}

export async function loadOrCreateProfile(): Promise<PlayerProfile> {
  const storage = await createStorage();
  const existing = await storage.getProfile();
  if (existing) return existing;

  const id = `guest_${Date.now().toString(36)}`;
  const profile = createDefaultProfile(id, getDefaultDisplayName());
  await storage.saveProfile(profile);
  return profile;
}

export { createStorage as getStorage };
