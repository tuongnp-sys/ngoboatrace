export const IDB_NAME = 'ngoboatrace_v1';
export const IDB_VERSION = 3;

export const STORE_PLAYER = 'player';
export const STORE_SYNC = 'syncQueue';
export const PROFILE_KEY = 'profile';

let dbPromise: Promise<IDBDatabase> | null = null;

function runMigrations(db: IDBDatabase): void {
  if (!db.objectStoreNames.contains(STORE_PLAYER)) {
    db.createObjectStore(STORE_PLAYER);
  }
  if (!db.objectStoreNames.contains(STORE_SYNC)) {
    db.createObjectStore(STORE_SYNC, { keyPath: 'id', autoIncrement: true });
  }
}

/**
 * Single entry point for IndexedDB — prevents duplicate openDb logic and migration races.
 * v3: ensures `syncQueue` exists on DBs stuck at v2 without that store (M1→M2 bug).
 */
export function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB not available'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(IDB_NAME, IDB_VERSION);

      request.onerror = () => {
        dbPromise = null;
        reject(request.error ?? new Error('IndexedDB open failed'));
      };

      request.onupgradeneeded = () => {
        runMigrations(request.result);
      };

      request.onsuccess = () => {
        const db = request.result;
        const missingSync = !db.objectStoreNames.contains(STORE_SYNC);
        const missingPlayer = !db.objectStoreNames.contains(STORE_PLAYER);

        if (missingSync || missingPlayer) {
          db.close();
          dbPromise = null;
          reject(
            new Error(
              `IndexedDB schema incomplete (player=${!missingPlayer}, syncQueue=${!missingSync}). ` +
                'Clear site data or delete ngoboatrace_v1 in DevTools.',
            ),
          );
          return;
        }

        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };

        resolve(db);
      };

      request.onblocked = () => {
        console.warn('[IDB] Upgrade blocked — close other tabs with this app open.');
      };
    });
  }

  return dbPromise;
}

/** Close pooled connection (tests / reset). */
export function closeDbPool(): void {
  dbPromise = null;
}
