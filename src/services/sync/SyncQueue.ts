import type { SyncAction } from '@/types/api.types';
import { openDb, STORE_SYNC } from '@/services/storage/idb';

export class SyncQueue {
  async enqueue(action: Omit<SyncAction, 'createdAt'>): Promise<void> {
    const db = await openDb();
    const entry: SyncAction = { ...action, createdAt: Date.now() } as SyncAction;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC, 'readwrite');
      tx.objectStore(STORE_SYNC).add(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async peekAll(): Promise<SyncAction[]> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC, 'readonly');
      const req = tx.objectStore(STORE_SYNC).getAll();
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result as SyncAction[]);
    });
  }

  async clear(): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC, 'readwrite');
      tx.objectStore(STORE_SYNC).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async replaceAll(actions: SyncAction[]): Promise<void> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC, 'readwrite');
      const store = tx.objectStore(STORE_SYNC);
      store.clear();
      for (const action of actions) {
        store.add(action);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const syncQueue = new SyncQueue();
