import { getLocale, setLocale, t } from '@/i18n';

export class LangToggle {
  readonly element: HTMLElement;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'lang-toggle';
    this.element.setAttribute('role', 'group');
    this.element.setAttribute('aria-label', 'Language');
    this.renderButtons();
  }

  private renderButtons(): void {
    const current = getLocale();
    this.element.innerHTML = `
      <button type="button" class="lang-toggle__btn ${current === 'en' ? 'lang-toggle__btn--active' : ''}" data-lang="en">${t('lang.en')}</button>
      <button type="button" class="lang-toggle__btn ${current === 'vi' ? 'lang-toggle__btn--active' : ''}" data-lang="vi">${t('lang.vi')}</button>
    `;

    this.element.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = (btn as HTMLElement).dataset.lang as 'en' | 'vi';
        if (lang && lang !== getLocale()) {
          setLocale(lang);
          this.renderButtons();
        }
      });
    });
  }

  refresh(): void {
    this.renderButtons();
  }
}
