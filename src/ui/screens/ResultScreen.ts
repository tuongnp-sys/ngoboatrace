import type { RaceResult } from '@/types/race.types';
import { applyI18n, registerLocaleRefresh, t } from '@/i18n';
import type { TranslationKey } from '@/i18n/types';
import { gameStateMachine } from '@/state/GameStateMachine';

export class ResultScreen {
  private localeUnsub: (() => void) | null = null;

  constructor(
    private result: RaceResult,
    private onRetry: () => void,
  ) {}

  render(): HTMLElement {
    this.localeUnsub?.();
    const el = document.createElement('div');
    el.className = 'result-screen';

    const rankEmoji = this.result.rank === 1 ? '🏆' : this.result.rank <= 3 ? '🥈' : '🛶';
    const perfectPct = Math.round(this.result.perfectRate * 100);

    el.innerHTML = `
      <div class="result-screen__card">
        <div class="result-screen__emoji">${rankEmoji}</div>
        <h2 class="result-screen__title" id="result-rank-title"></h2>
        <p class="result-screen__clutch" id="result-clutch" hidden></p>
        <p class="result-screen__leaderboard" id="result-leaderboard" hidden></p>
        <div class="result-screen__stats">
          <div class="stat"><span class="stat__val">${perfectPct}%</span><span class="stat__lbl" data-i18n="result.stat.perfect"></span></div>
          <div class="stat"><span class="stat__val">${Math.round(this.result.syncAvg)}</span><span class="stat__lbl" data-i18n="result.stat.sync"></span></div>
          <div class="stat"><span class="stat__val">${(this.result.durationMs / 1000).toFixed(0)}s</span><span class="stat__lbl" data-i18n="result.stat.time"></span></div>
        </div>
        <div class="result-screen__actions">
          <button class="btn btn-primary" id="btn-retry" data-i18n="result.retry"></button>
          <button class="btn btn-secondary" id="btn-home" data-i18n="result.home"></button>
        </div>
      </div>
    `;

    const refresh = () => {
      const titleEl = el.querySelector('#result-rank-title')!;
      titleEl.textContent =
        this.result.rank === 1
          ? t('result.win')
          : t('result.rank', { rank: this.result.rank, total: this.result.totalBoats });

      const clutchEl = el.querySelector('#result-clutch') as HTMLElement;
      if (this.result.clutchSuccess) {
        clutchEl.hidden = false;
        clutchEl.textContent = t('result.clutch');
      } else {
        clutchEl.hidden = true;
      }

      const lbEl = el.querySelector('#result-leaderboard') as HTMLElement;
      const lb = this.result.leaderboard;
      if (lb?.messageKey) {
        lbEl.hidden = false;
        lbEl.textContent = t(lb.messageKey as TranslationKey, lb.messageParams);
      } else {
        lbEl.hidden = true;
      }

      applyI18n(el);
    };
    refresh();
    this.localeUnsub = registerLocaleRefresh(refresh);

    el.querySelector('#btn-retry')?.addEventListener('click', () => this.onRetry());
    el.querySelector('#btn-home')?.addEventListener('click', () => {
      gameStateMachine.transition('home');
    });

    return el;
  }
}
