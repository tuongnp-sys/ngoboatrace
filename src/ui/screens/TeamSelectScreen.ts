import { getTeamFlagSvg } from '@/config/team.brands';
import { TEAMS } from '@/config/teams.config';
import { getTeamColorCss } from '@/config/team.colors';
import { applyI18n, getTeamMotto, registerLocaleRefresh } from '@/i18n';
import { gameStateMachine } from '@/state/GameStateMachine';
import { gameEvents } from '@/state/events';

export class TeamSelectScreen {
  private selectedTeamId = 'soc-trang';
  private localeUnsub: (() => void) | null = null;

  render(): HTMLElement {
    this.localeUnsub?.();
    const el = document.createElement('div');
    el.className = 'team-select';

    const teamCards = TEAMS.map(
      (t) => `
      <button class="team-card ${t.id === this.selectedTeamId ? 'team-card--selected' : ''}"
        data-team="${t.id}" style="--team-color: ${getTeamColorCss(t.id)}">
        <span class="team-card__flag">${getTeamFlagSvg(t.id)}</span>
        <span class="team-card__name">${t.name}</span>
        <span class="team-card__motto" data-team-motto="${t.id}">${getTeamMotto(t.id)}</span>
      </button>`,
    ).join('');

    el.innerHTML = `
      <div class="team-select__body">
        <button class="btn-back" id="btn-back">←</button>
        <h2 class="team-select__title" data-i18n="team.title"></h2>
        <p class="team-select__sub" data-i18n="team.sub"></p>
        <div class="team-select__grid">${teamCards}</div>
        <p class="team-select__rivals" data-i18n="team.rivals"></p>
      </div>
      <div class="team-select__footer">
        <button class="btn btn-primary btn-start" id="btn-start" data-i18n="team.start"></button>
      </div>
    `;

    const refresh = () => {
      applyI18n(el);
      el.querySelectorAll<HTMLElement>('[data-team-motto]').forEach((m) => {
        const teamId = m.dataset.teamMotto!;
        m.textContent = getTeamMotto(teamId);
      });
    };
    refresh();
    this.localeUnsub = registerLocaleRefresh(refresh);

    el.querySelector('#btn-back')?.addEventListener('click', () => {
      gameStateMachine.transition('home');
    });

    el.querySelectorAll('.team-card').forEach((card) => {
      card.addEventListener('click', () => {
        this.selectedTeamId = (card as HTMLElement).dataset.team!;
        el.querySelectorAll('.team-card').forEach((c) => c.classList.remove('team-card--selected'));
        card.classList.add('team-card--selected');
      });
    });

    el.querySelector('#btn-start')?.addEventListener('click', () => {
      void import('@/state/stores/playerStore').then(({ playerStore }) => {
        void playerStore.update((p) => ({ ...p, teamId: this.selectedTeamId }));
      });
      gameEvents.emit('race:prepare', { mode: 'quick', teamId: this.selectedTeamId });
      gameStateMachine.transition('race');
    });

    return el;
  }
}
