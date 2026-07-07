import { env } from '@/config/env';
import { applyI18n, registerLocaleRefresh, t } from '@/i18n';
import { offlineDetector } from '@/services/network/OfflineDetector';
import { pwaInstall } from '@/services/pwa/PwaInstall';
import { syncQueue } from '@/services/sync/SyncQueue';
import { createStorage } from '@/services/storage/IndexedDBStore';
import { isSoundEnabled, setSoundEnabled } from '@/state/settingsStore';
import { gameStateMachine } from '@/state/GameStateMachine';
import { playerStore } from '@/state/stores/playerStore';
import { syncManager } from '@/services/sync/SyncManager';
import {
  DISPLAY_NAME_MAX_LENGTH,
  sanitizeDisplayName,
} from '@/utils/displayName';

export class SettingsScreen {
  private localeUnsub: (() => void) | null = null;
  private networkUnsub: (() => void) | null = null;
  private pwaUnsub: (() => void) | null = null;

  render(): HTMLElement {
    this.localeUnsub?.();
    this.networkUnsub?.();
    this.pwaUnsub?.();

    const el = document.createElement('div');
    el.className = 'settings-screen';

    el.innerHTML = `
      <button class="btn-back" id="btn-back" aria-label="Back">←</button>
      <h2 class="settings-screen__title" data-i18n="settings.title"></h2>
      <p class="settings-screen__beta" data-i18n="settings.beta"></p>

      <section class="settings-section settings-section--pwa" id="pwa-section">
        <h3 class="settings-section__heading" data-i18n="settings.pwa.heading"></h3>
        <p class="settings-section__sub" data-i18n="settings.pwa.sub"></p>
        <p class="settings-pwa-installed" id="pwa-installed" hidden data-i18n="settings.pwa.installed"></p>
        <button type="button" class="btn btn-primary settings-pwa-btn" id="pwa-install" hidden data-i18n="settings.pwa.install"></button>
        <p class="settings-pwa-hint" id="pwa-hint-ios" hidden data-i18n="settings.pwa.iosHint"></p>
        <p class="settings-pwa-hint" id="pwa-hint-android" hidden data-i18n="settings.pwa.androidHint"></p>
        <p class="settings-pwa-hint" id="pwa-hint-desktop" hidden data-i18n="settings.pwa.desktopHint"></p>
        <p class="settings-hint settings-pwa-dev" id="pwa-dev-note" hidden data-i18n="settings.pwa.devNote"></p>
        <details class="settings-pwa-details" id="pwa-details">
          <summary data-i18n="settings.pwa.manualDetails"></summary>
          <ol class="settings-pwa-steps" id="pwa-steps-ios" hidden>
            <li data-i18n="settings.pwa.iosStep1"></li>
            <li data-i18n="settings.pwa.iosStep2"></li>
            <li data-i18n="settings.pwa.iosStep3"></li>
          </ol>
          <ol class="settings-pwa-steps" id="pwa-steps-android" hidden>
            <li data-i18n="settings.pwa.androidStep1"></li>
            <li data-i18n="settings.pwa.androidStep2"></li>
            <li data-i18n="settings.pwa.androidStep3"></li>
          </ol>
          <ol class="settings-pwa-steps" id="pwa-steps-desktop" hidden>
            <li data-i18n="settings.pwa.desktopStep1"></li>
            <li data-i18n="settings.pwa.desktopStep2"></li>
            <li data-i18n="settings.pwa.desktopStep3"></li>
          </ol>
        </details>
      </section>

      <section class="settings-section settings-section--network" id="network-section">
        <h3 class="settings-section__heading" data-i18n="settings.network.heading"></h3>
        <p class="settings-status" id="network-status"></p>
      </section>

      <section class="settings-section">
        <h3 class="settings-section__heading" data-i18n="settings.offline.heading"></h3>
        <ul class="settings-list">
          <li class="settings-list__item settings-list__item--ok" data-i18n="settings.offline.quick"></li>
          <li class="settings-list__item settings-list__item--ok" data-i18n="settings.offline.story"></li>
          <li class="settings-list__item settings-list__item--ok" data-i18n="settings.offline.festival"></li>
          <li class="settings-list__item settings-list__item--warn" data-i18n="settings.offline.daily"></li>
          <li class="settings-list__item settings-list__item--no" data-i18n="settings.offline.leaderboard"></li>
        </ul>
      </section>

      <section class="settings-section">
        <h3 class="settings-section__heading" data-i18n="settings.profile.heading"></h3>
        <label class="settings-field">
          <span class="settings-field__label" data-i18n="settings.profile.displayName"></span>
          <input
            type="text"
            class="settings-field__input"
            id="display-name"
            maxlength="${DISPLAY_NAME_MAX_LENGTH}"
            autocomplete="nickname"
            enterkeyhint="done"
          />
        </label>
        <p class="settings-hint" data-i18n="settings.profile.displayNameHint"></p>
        <button type="button" class="btn btn-secondary settings-save-name-btn" id="save-display-name" data-i18n="settings.profile.save"></button>
        <p class="settings-name-status" id="name-status" hidden data-i18n="settings.profile.saved"></p>
      </section>

      <section class="settings-section">
        <h3 class="settings-section__heading" data-i18n="settings.prefs.heading"></h3>
        <label class="settings-toggle">
          <span data-i18n="settings.prefs.sound"></span>
          <input type="checkbox" id="sound-toggle" />
        </label>
      </section>

      <section class="settings-section">
        <h3 class="settings-section__heading" data-i18n="settings.data.heading"></h3>
        <p class="settings-pending" id="pending-sync" hidden></p>
        <button class="btn btn-secondary settings-danger-btn" id="clear-progress" data-i18n="settings.data.clear"></button>
        <p class="settings-hint" data-i18n="settings.data.clearHint"></p>
      </section>

      <p class="settings-version" data-i18n="home.version" data-i18n-version="${env.appVersion}"></p>
    `;

    const soundToggle = el.querySelector('#sound-toggle') as HTMLInputElement;
    soundToggle.checked = isSoundEnabled();
    soundToggle.addEventListener('change', () => {
      setSoundEnabled(soundToggle.checked);
    });

    const displayNameInput = el.querySelector('#display-name') as HTMLInputElement;
    displayNameInput.value = playerStore.get().displayName;
    displayNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void this.saveDisplayName(el, displayNameInput);
      }
    });
    el.querySelector('#save-display-name')?.addEventListener('click', () => {
      void this.saveDisplayName(el, displayNameInput);
    });

    const refresh = () => {
      applyI18n(el);
      this.updateNetwork(el);
      this.updatePwa(el);
      void this.updatePendingSync(el);
    };

    refresh();
    this.localeUnsub = registerLocaleRefresh(refresh);

    this.networkUnsub = offlineDetector.onChange(() => {
      this.updateNetwork(el);
      void this.updatePendingSync(el);
    });

    this.pwaUnsub = pwaInstall.onChange(() => this.updatePwa(el));

    el.querySelector('#btn-back')?.addEventListener('click', () => {
      gameStateMachine.transition('home');
    });

    el.querySelector('#pwa-install')?.addEventListener('click', () => {
      void pwaInstall.promptInstall();
    });

    el.querySelector('#clear-progress')?.addEventListener('click', () => {
      if (window.confirm(t('settings.data.clearConfirm'))) {
        void this.clearLocalData();
      }
    });

    return el;
  }

  private updateNetwork(el: HTMLElement): void {
    const statusEl = el.querySelector('#network-status') as HTMLElement;
    const section = el.querySelector('#network-section') as HTMLElement;
    const online = offlineDetector.isOnline();
    const featuresOn = env.features.onlineLeaderboard || env.features.cloudSave;

    if (!featuresOn) {
      statusEl.textContent = t('network.offlineMode');
      section.className = 'settings-section settings-section--network settings-section--neutral';
      return;
    }

    statusEl.textContent = online ? t('settings.network.online') : t('settings.network.offline');
    section.className = online
      ? 'settings-section settings-section--network settings-section--online'
      : 'settings-section settings-section--network settings-section--offline';
  }

  private updatePwa(el: HTMLElement): void {
    const installedEl = el.querySelector('#pwa-installed') as HTMLElement;
    const installBtn = el.querySelector('#pwa-install') as HTMLButtonElement;
    const devNoteEl = el.querySelector('#pwa-dev-note') as HTMLElement;
    const detailsEl = el.querySelector('#pwa-details') as HTMLDetailsElement;
    const hintIos = el.querySelector('#pwa-hint-ios') as HTMLElement;
    const hintAndroid = el.querySelector('#pwa-hint-android') as HTMLElement;
    const hintDesktop = el.querySelector('#pwa-hint-desktop') as HTMLElement;
    const iosSteps = el.querySelector('#pwa-steps-ios') as HTMLElement;
    const androidSteps = el.querySelector('#pwa-steps-android') as HTMLElement;
    const desktopSteps = el.querySelector('#pwa-steps-desktop') as HTMLElement;

    const standalone = pwaInstall.isStandalone();
    const canPrompt = pwaInstall.canPrompt();
    const isIos = pwaInstall.isIos();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    installedEl.hidden = !standalone;
    detailsEl.hidden = standalone;

    if (standalone) {
      installBtn.hidden = true;
      devNoteEl.hidden = true;
      hintIos.hidden = true;
      hintAndroid.hidden = true;
      hintDesktop.hidden = true;
      return;
    }

    installBtn.hidden = !canPrompt;
    installBtn.disabled = !canPrompt;

    const showHint = !canPrompt;
    hintIos.hidden = !(showHint && isIos);
    hintAndroid.hidden = !(showHint && !isIos && isMobile);
    hintDesktop.hidden = !(showHint && !isMobile);
    devNoteEl.hidden = !(import.meta.env.DEV && !canPrompt);

    iosSteps.hidden = !isIos;
    androidSteps.hidden = isIos || !isMobile;
    desktopSteps.hidden = isMobile;
  }

  private async updatePendingSync(el: HTMLElement): Promise<void> {
    const pendingEl = el.querySelector('#pending-sync') as HTMLElement;
    if (!env.features.onlineLeaderboard && !env.features.cloudSave) {
      pendingEl.hidden = true;
      return;
    }

    try {
      const count = (await syncQueue.peekAll()).length;
      if (count > 0) {
        pendingEl.hidden = false;
        pendingEl.textContent = t('settings.data.pending', { count });
      } else {
        pendingEl.hidden = true;
      }
    } catch {
      pendingEl.hidden = true;
    }
  }

  private async saveDisplayName(el: HTMLElement, input: HTMLInputElement): Promise<void> {
    const statusEl = el.querySelector('#name-status') as HTMLElement;
    const name = sanitizeDisplayName(input.value);
    input.value = name;

    const current = playerStore.get().displayName;
    if (name === current) {
      statusEl.hidden = false;
      statusEl.textContent = t('settings.profile.saved');
      window.setTimeout(() => {
        statusEl.hidden = true;
      }, 2000);
      return;
    }

    await playerStore.update((p) => ({ ...p, displayName: name }));
    await syncManager.saveProgress();

    statusEl.hidden = false;
    statusEl.textContent = t('settings.profile.saved');
    window.setTimeout(() => {
      statusEl.hidden = true;
    }, 2500);
  }

  private async clearLocalData(): Promise<void> {
    const storage = await createStorage();
    await storage.clear();
    await syncQueue.clear();
    location.reload();
  }
}
