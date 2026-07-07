import { gameEvents } from '@/state/events';

type OnlineListener = (online: boolean) => void;

class OfflineDetectorImpl {
  private listeners = new Set<OnlineListener>();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.emit(true));
      window.addEventListener('offline', () => this.emit(false));
    }
  }

  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  onChange(listener: OnlineListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(online: boolean): void {
    gameEvents.emit('network:status', { online });
    this.listeners.forEach((fn) => fn(online));
  }
}

export const offlineDetector = new OfflineDetectorImpl();
