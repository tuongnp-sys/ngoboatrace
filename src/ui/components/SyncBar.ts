import { registerLocaleRefresh, t } from '@/i18n';

export class SyncBar {
  private fillEl: HTMLElement;
  private valueEl: HTMLElement;
  private labelEl: HTMLElement;

  constructor(root: HTMLElement) {
    const wrap = document.createElement('div');
    wrap.className = 'hud-bar hud-bar--sync';
    wrap.innerHTML = `
      <span class="hud-bar__label" data-sync-label></span>
      <div class="hud-bar__track"><div class="hud-bar__fill hud-bar__fill--sync"></div></div>
      <span class="hud-bar__value">50%</span>
    `;
    root.appendChild(wrap);
    this.fillEl = wrap.querySelector('.hud-bar__fill')!;
    this.valueEl = wrap.querySelector('.hud-bar__value')!;
    this.labelEl = wrap.querySelector('[data-sync-label]')!;
    this.applyLabel();
    registerLocaleRefresh(() => this.applyLabel());
  }

  private applyLabel(): void {
    this.labelEl.textContent = t('hud.sync');
  }

  update(sync: number): void {
    const clamped = Math.max(0, Math.min(100, sync));
    this.fillEl.style.width = `${clamped}%`;
    this.valueEl.textContent = `${Math.round(clamped)}%`;

    this.fillEl.classList.toggle('hud-bar__fill--low', clamped < 30);
    this.fillEl.classList.toggle('hud-bar__fill--mid', clamped >= 30 && clamped < 70);
    this.fillEl.classList.toggle('hud-bar__fill--high', clamped >= 70);
  }
}
