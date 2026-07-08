import { env } from '@/config/env';
import { RaceSession, type RaceStartOptions } from '@/game/RaceSession';
import { syncManager } from '@/services/sync/SyncManager';
import { gameStateMachine } from '@/state/GameStateMachine';
import { playerStore } from '@/state/stores/playerStore';
import { gameEvents } from '@/state/events';
import type { RaceResult } from '@/types/race.types';
import { applyI18n, registerLocaleRefresh } from '@/i18n';
import { loadSoundPreference } from '@/state/settingsStore';
import { HomeScreen } from '@/ui/screens/HomeScreen';
import { FestivalScreen } from '@/ui/screens/FestivalScreen';
import { LeaderboardScreen } from '@/ui/screens/LeaderboardScreen';
import { StoryScreen } from '@/ui/screens/StoryScreen';
import { TeamSelectScreen } from '@/ui/screens/TeamSelectScreen';
import { SettingsScreen } from '@/ui/screens/SettingsScreen';
import { LangToggle } from '@/ui/components/LangToggle';
import { apiClient } from '@/services/network/ApiClient';
import { localizeDefaultDisplayName } from '@/utils/displayName';

export class App {
  private root: HTMLElement;
  private homeScreen: HomeScreen;
  private langToggle: LangToggle;
  private activeSession: RaceSession | null = null;
  private pendingRace: RaceStartOptions = { teamId: 'soc-trang', mode: 'quick' };
  private lastResult: RaceResult | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.homeScreen = new HomeScreen();
    this.langToggle = new LangToggle();
    gameEvents.on('screen:change', ({ screen }) => void this.render(screen));
    gameEvents.on('race:prepare', (opts) => {
      this.pendingRace = {
        teamId: opts.teamId ?? playerStore.get().teamId,
        mode: opts.mode,
        chapterId: opts.chapterId,
      };
    });
  }

  async init(): Promise<void> {
    document.body.appendChild(this.langToggle.element);
    registerLocaleRefresh(() => this.langToggle.refresh());

    await playerStore.init();
    loadSoundPreference();
    this.registerLocaleDisplayNameSync();
    await syncManager.init();
    this.registerServiceWorker();
    await this.render('home');
  }

  private async render(screen: string): Promise<void> {
    this.destroySession();
    this.root.innerHTML = '';

    switch (screen) {
      case 'home':
        this.root.appendChild(this.homeScreen.render());
        break;

      case 'festival':
        this.root.appendChild(new FestivalScreen().render());
        break;

      case 'team_select':
        this.root.appendChild(new TeamSelectScreen().render());
        break;

      case 'story':
        this.root.appendChild(
          new StoryScreen((chapterId) => {
            this.pendingRace = {
              teamId: playerStore.get().teamId,
              mode: 'story',
              chapterId,
            };
            gameStateMachine.transition('race');
          }).render(),
        );
        break;

      case 'leaderboard':
        this.root.appendChild(new LeaderboardScreen().render());
        break;

      case 'settings':
        this.root.appendChild(new SettingsScreen().render());
        break;

      case 'race':
        await this.prepareDailyIfNeeded();
        this.startRace(this.pendingRace);
        break;

      case 'result':
        if (this.lastResult) {
          RaceSession.showResult(this.root, this.lastResult, () => {
            if (this.pendingRace.mode === 'story') {
              gameStateMachine.transition('story');
            } else {
              gameStateMachine.transition('team_select');
            }
          });
        } else {
          gameStateMachine.transition('home');
        }
        break;

      default:
        this.renderPlaceholder(screen);
    }
  }

  private async prepareDailyIfNeeded(): Promise<void> {
    if (this.pendingRace.mode !== 'daily') return;
    const res = await apiClient.get<{ seed: number }>('/daily');
    if (res.ok) {
      this.pendingRace = { ...this.pendingRace, seed: res.data.seed };
    }
  }

  private startRace(options: RaceStartOptions): void {
    this.activeSession = new RaceSession(options, (result) => {
      this.lastResult = result;
      this.activeSession = null;
      gameStateMachine.transition('result');
    });
    this.activeSession.start(this.root);
  }

  private destroySession(): void {
    this.activeSession?.destroy();
    this.activeSession = null;
  }

  private renderPlaceholder(screen: string): void {
    const placeholder = document.createElement('div');
    placeholder.className = 'screen-placeholder';
    placeholder.innerHTML = `
      <p data-i18n="placeholder.screen" data-i18n-html="true" data-i18n-screen="${screen}"></p>
      <button class="btn btn-secondary" id="btn-back" data-i18n="placeholder.home"></button>`;
    applyI18n(placeholder);
    registerLocaleRefresh(() => applyI18n(placeholder));
    placeholder.querySelector('#btn-back')?.addEventListener('click', () => {
      gameStateMachine.transition('home');
    });
    this.root.appendChild(placeholder);
  }

  private registerServiceWorker(): void {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }

  private registerLocaleDisplayNameSync(): void {
    gameEvents.on('locale:change', () => {
      void this.syncDefaultDisplayNameForLocale();
    });
  }

  private async syncDefaultDisplayNameForLocale(): Promise<void> {
    try {
      const current = playerStore.get().displayName;
      const next = localizeDefaultDisplayName(current);
      if (next === current) return;
      await playerStore.update((p) => ({ ...p, displayName: next }));
      await syncManager.saveProgress();
    } catch {
      /* playerStore not ready */
    }
  }

  static getVersion(): string {
    return env.appVersion;
  }
}
