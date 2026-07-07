type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PwaInstallService {
  private deferred: BeforeInstallPromptEvent | null = null;
  private listeners = new Set<() => void>();

  constructor() {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferred = e as BeforeInstallPromptEvent;
      this.notify();
    });

    window.addEventListener('appinstalled', () => {
      this.deferred = null;
      this.notify();
    });
  }

  canPrompt(): boolean {
    return this.deferred !== null;
  }

  isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  }

  isIos(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async promptInstall(): Promise<InstallOutcome> {
    if (!this.deferred) return 'unavailable';
    await this.deferred.prompt();
    const { outcome } = await this.deferred.userChoice;
    if (outcome === 'accepted') {
      this.deferred = null;
      this.notify();
    }
    return outcome;
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

export const pwaInstall = new PwaInstallService();
