import { getLocale, registerLocaleRefresh } from '@/i18n';
import { renderFestivalHtml } from '@/content/festival/festivalContent';
import { gameStateMachine } from '@/state/GameStateMachine';

const SCROLL_ANCHOR_OFFSET = 12;

export class FestivalScreen {
  private localeUnsub: (() => void) | null = null;
  private bodyEl: HTMLElement | null = null;
  private scrollEl: HTMLElement | null = null;

  render(): HTMLElement {
    this.localeUnsub?.();
    const el = document.createElement('div');
    el.className = 'festival-screen';

    el.innerHTML = `
      <button class="btn-back" id="btn-back" aria-label="Back">←</button>
      <div class="festival-scroll">
        <div class="festival-scroll__paper">
          <div class="festival-scroll__inner" id="festival-body"></div>
        </div>
      </div>
    `;

    this.bodyEl = el.querySelector('#festival-body');
    this.scrollEl = el.querySelector('.festival-scroll');
    this.renderContent();

    this.localeUnsub = registerLocaleRefresh(() => this.renderContent());

    el.querySelector('#btn-back')?.addEventListener('click', () => {
      gameStateMachine.transition('home');
    });

    return el;
  }

  private renderContent(): void {
    if (!this.bodyEl) return;

    const anchorId = this.getVisibleSectionId();
    this.bodyEl.innerHTML = renderFestivalHtml(getLocale());

    if (anchorId) {
      requestAnimationFrame(() => this.scrollToSection(anchorId));
    }
  }

  /** Section nearest the top of the scroll viewport (same anchor in EN/VN). */
  private getVisibleSectionId(): string | null {
    if (!this.scrollEl || !this.bodyEl) return null;

    const containerTop = this.scrollEl.getBoundingClientRect().top;
    const headings = this.bodyEl.querySelectorAll<HTMLElement>('h2[id]');
    if (headings.length === 0) return null;

    let bestId: string | null = null;
    let bestTop = -Infinity;

    headings.forEach((heading) => {
      const top = heading.getBoundingClientRect().top - containerTop;
      if (top <= SCROLL_ANCHOR_OFFSET + 48 && top > bestTop) {
        bestTop = top;
        bestId = heading.id;
      }
    });

    return bestId ?? headings[0]?.id ?? null;
  }

  private scrollToSection(sectionId: string): void {
    if (!this.scrollEl || !this.bodyEl) return;

    const target = this.bodyEl.querySelector<HTMLElement>(`#${CSS.escape(sectionId)}`);
    if (!target) return;

    const containerTop = this.scrollEl.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;
    this.scrollEl.scrollTop += targetTop - containerTop - SCROLL_ANCHOR_OFFSET;
  }
}
