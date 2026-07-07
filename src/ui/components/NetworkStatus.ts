import { offlineDetector } from '@/services/network/OfflineDetector';
import { env } from '@/config/env';
import { registerLocaleRefresh, t } from '@/i18n';

export class NetworkStatus {
  private el: HTMLElement;

  constructor() {
    this.el = document.createElement('span');
    this.el.className = 'network-badge network-badge--online';
    this.update();

    offlineDetector.onChange(() => this.update());
    if (env.features.onlineLeaderboard || env.features.cloudSave) {
      window.addEventListener('online', () => this.update());
      window.addEventListener('offline', () => this.update());
    }

    registerLocaleRefresh(() => this.update());
  }

  getElement(): HTMLElement {
    return this.el;
  }

  private update(): void {
    const online = offlineDetector.isOnline();
    const featuresOn = env.features.onlineLeaderboard || env.features.cloudSave;

    if (!featuresOn) {
      this.el.textContent = t('network.offlineMode');
      this.el.className = 'network-badge';
      return;
    }

    this.el.textContent = online ? t('network.online') : t('network.offlinePlay');
    this.el.className = online
      ? 'network-badge network-badge--online'
      : 'network-badge network-badge--offline';
  }
}
