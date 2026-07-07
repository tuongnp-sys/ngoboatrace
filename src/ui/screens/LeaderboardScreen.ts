import { env } from '@/config/env';
import { apiClient } from '@/services/network/ApiClient';
import { offlineDetector } from '@/services/network/OfflineDetector';
import { applyI18n, registerLocaleRefresh } from '@/i18n';
import { gameStateMachine } from '@/state/GameStateMachine';
import type { LeaderboardEntry } from '@/types/api.types';

export class LeaderboardScreen {
  private localeUnsub: (() => void) | null = null;
  private activeTab: 'daily' | 'weekly' = 'daily';
  private rootEl: HTMLElement | null = null;

  render(): HTMLElement {
    this.localeUnsub?.();
    const el = document.createElement('div');
    el.className = 'leaderboard-screen';
    this.rootEl = el;
    el.innerHTML = `
      <button class="btn-back" id="btn-back">←</button>
      <h2 class="leaderboard-screen__title" data-i18n="leaderboard.title"></h2>
      <p class="leaderboard-screen__sub" data-i18n="leaderboard.sub"></p>
      <div class="leaderboard-tabs">
        <button class="tab tab--active" data-tab="daily" data-i18n="leaderboard.tab.daily"></button>
        <button class="tab" data-tab="weekly" data-i18n="leaderboard.tab.weekly"></button>
      </div>
      <div id="lb-content" class="leaderboard-list">
        <p class="leaderboard-loading" data-i18n="leaderboard.loading"></p>
      </div>
    `;

    const refreshStatic = () => applyI18n(el);
    refreshStatic();
    this.localeUnsub = registerLocaleRefresh(() => {
      refreshStatic();
      void this.load(this.activeTab);
    });

    el.querySelector('#btn-back')?.addEventListener('click', () => {
      gameStateMachine.transition('home');
    });

    el.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        el.querySelectorAll('.tab').forEach((t) => t.classList.remove('tab--active'));
        tab.classList.add('tab--active');
        this.activeTab = (tab as HTMLElement).dataset.tab as 'daily' | 'weekly';
        void this.load(this.activeTab);
      });
    });

    void this.load('daily');
    return el;
  }

  private async load(tab: 'daily' | 'weekly'): Promise<void> {
    if (!this.rootEl) return;
    const content = this.rootEl.querySelector('#lb-content') as HTMLElement;

    if (!env.features.onlineLeaderboard) {
      content.innerHTML = `<p class="leaderboard-empty" data-i18n="leaderboard.featureOff"></p>`;
      applyI18n(content);
      return;
    }
    if (!offlineDetector.isOnline()) {
      content.innerHTML = `<p class="leaderboard-empty" data-i18n="leaderboard.offline"></p>`;
      applyI18n(content);
      return;
    }

    content.innerHTML = `<p class="leaderboard-loading" data-i18n="leaderboard.loading"></p>`;
    applyI18n(content);

    const path = tab === 'daily' ? '/leaderboard/daily' : '/leaderboard/weekly';
    const res = await apiClient.get<{ entries: LeaderboardEntry[]; date?: string }>(path);

    if (!res.ok) {
      content.innerHTML = `<p class="leaderboard-empty" data-i18n="leaderboard.loadError" data-i18n-code="${res.error.code}"></p>`;
      applyI18n(content);
      return;
    }

    if (res.data.entries.length === 0) {
      content.innerHTML = `<p class="leaderboard-empty" data-i18n="leaderboard.empty"></p>`;
      applyI18n(content);
      return;
    }

    content.innerHTML = res.data.entries
      .map(
        (e) => `
        <div class="lb-row ${e.rank <= 3 ? 'lb-row--top' : ''}">
          <span class="lb-rank">#${e.rank}</span>
          <span class="lb-name">${e.displayName}</span>
          <span class="lb-score">${e.score}</span>
          <span class="lb-perfect">${Math.round(e.perfectRate * 100)}%</span>
        </div>`,
      )
      .join('');
  }
}
