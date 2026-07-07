import { CHAPTERS } from '@/config/chapters.config';
import {
  applyI18n,
  getChapterSubtitle,
  getChapterTitle,
  registerLocaleRefresh,
  t,
} from '@/i18n';
import { playerStore } from '@/state/stores/playerStore';
import { gameStateMachine } from '@/state/GameStateMachine';

export class StoryScreen {
  private onStartChapter?: (chapterId: number) => void;
  private localeUnsub: (() => void) | null = null;

  constructor(onStartChapter?: (chapterId: number) => void) {
    this.onStartChapter = onStartChapter;
  }

  render(): HTMLElement {
    this.localeUnsub?.();
    const el = document.createElement('div');
    el.className = 'story-screen';

    const profile = playerStore.get();
    const cards = CHAPTERS.map((ch) => {
      const unlocked = playerStore.isChapterUnlocked(ch.id);
      const done = playerStore.isChapterCompleted(ch.id);
      const status = done ? '✅' : unlocked ? '▶️' : '🔒';
      const lockedClass = unlocked ? '' : 'chapter-card--locked';
      const doneClass = done ? 'chapter-card--done' : '';

      return `
        <button class="chapter-card ${lockedClass} ${doneClass}" data-chapter="${ch.id}" ${unlocked ? '' : 'disabled'}>
          <span class="chapter-card__status">${status}</span>
          <span class="chapter-card__num" data-chapter-num="${ch.id}">${t('story.chapter', { id: ch.id })}</span>
          <span class="chapter-card__title" data-chapter-title="${ch.id}">${getChapterTitle(ch.id)}</span>
          <span class="chapter-card__sub" data-chapter-sub="${ch.id}">${getChapterSubtitle(ch.id)}</span>
          <span class="chapter-card__teams" data-chapter-id="${ch.id}">${t('story.teams', { count: ch.opponentIds.length + 1 })}</span>
        </button>`;
    }).join('');

    el.innerHTML = `
      <button class="btn-back" id="btn-back">←</button>
      <h2 class="story-screen__title" data-i18n="story.title"></h2>
      <p class="story-screen__progress" data-i18n="story.progress" data-i18n-current="${profile.story.currentChapter}"></p>
      <div class="story-screen__list">${cards}</div>
    `;

    const refresh = () => {
      const p = playerStore.get();
      el.querySelector<HTMLElement>('[data-i18n-current]')?.setAttribute(
        'data-i18n-current',
        String(p.story.currentChapter),
      );
      applyI18n(el);
      CHAPTERS.forEach((ch) => {
        el.querySelector(`[data-chapter-num="${ch.id}"]`)!.textContent = t('story.chapter', {
          id: ch.id,
        });
        el.querySelector(`[data-chapter-title="${ch.id}"]`)!.textContent = getChapterTitle(ch.id);
        el.querySelector(`[data-chapter-sub="${ch.id}"]`)!.textContent = getChapterSubtitle(ch.id);
        el.querySelector(`[data-chapter-id="${ch.id}"]`)!.textContent = t('story.teams', {
          count: ch.opponentIds.length + 1,
        });
      });
    };
    refresh();
    this.localeUnsub = registerLocaleRefresh(refresh);

    el.querySelector('#btn-back')?.addEventListener('click', () => {
      gameStateMachine.transition('home');
    });

    el.querySelectorAll('.chapter-card:not([disabled])').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number((btn as HTMLElement).dataset.chapter);
        this.onStartChapter?.(id);
      });
    });

    return el;
  }
}
