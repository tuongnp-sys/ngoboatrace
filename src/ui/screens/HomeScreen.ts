import { env } from '@/config/env';
import { applyI18n, registerLocaleRefresh } from '@/i18n';
import { gameStateMachine } from '@/state/GameStateMachine';
import { gameEvents } from '@/state/events';
import { playerStore } from '@/state/stores/playerStore';
import { NetworkStatus } from '@/ui/components/NetworkStatus';

export class HomeScreen {
  private networkStatus = new NetworkStatus();
  private localeUnsub: (() => void) | null = null;

  render(): HTMLElement {
    this.localeUnsub?.();
    const el = document.createElement('div');
    el.className = 'home-screen';

    const onlineFeatures = env.features.onlineLeaderboard || env.features.cloudSave;

    el.innerHTML = `
      <div class="home-screen__logo">🛶</div>
      <span class="home-screen__beta" data-i18n="home.beta"></span>
      <h1 class="home-screen__title" data-i18n="home.title"></h1>
      <p class="home-screen__subtitle" data-i18n="home.subtitle"></p>
      <div id="network-slot"></div>
      <div class="home-screen__actions">
        <button class="btn btn-play" data-action="quick" data-i18n="home.quick"></button>
        <button class="btn btn-festival" data-action="festival" data-i18n="home.festival"></button>
      </div>
      <nav class="home-screen__menu">
        <button class="btn btn-secondary" data-action="story" data-i18n="home.story" ${env.features.storyMode ? '' : 'disabled'}></button>
        <button class="btn btn-secondary" data-action="daily" data-i18n="home.daily" ${env.features.dailyChallenge ? '' : 'disabled'}></button>
        <button class="btn btn-secondary" data-action="leaderboard" data-i18n="home.leaderboard" ${onlineFeatures ? '' : 'disabled'}></button>
        <button class="btn btn-secondary" data-action="settings" data-i18n="home.settings"></button>
      </nav>
      <p class="home-screen__version" data-i18n="home.version" data-i18n-version="${env.appVersion}"></p>
    `;

    applyI18n(el);
    this.localeUnsub = registerLocaleRefresh(() => applyI18n(el));

    el.querySelector('#network-slot')?.appendChild(this.networkStatus.getElement());

    el.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = (btn as HTMLElement).dataset.action;
        switch (action) {
          case 'quick':
            gameStateMachine.transition('team_select');
            break;
          case 'festival':
            gameStateMachine.transition('festival');
            break;
          case 'story':
            gameStateMachine.transition('story');
            break;
          case 'daily':
            gameEvents.emit('race:prepare', { mode: 'daily', teamId: playerStore.get().teamId });
            gameStateMachine.transition('race');
            break;
          case 'leaderboard':
            gameStateMachine.transition('leaderboard');
            break;
          case 'settings':
            gameStateMachine.transition('settings');
            break;
        }
      });
    });

    return el;
  }
}
