import { registerLocaleRefresh, t } from '@/i18n';

export class StaminaBar {
  private fillEl: HTMLElement;
  private valueEl: HTMLElement;
  private labelEl: HTMLElement;

  constructor(root: HTMLElement) {
    const wrap = document.createElement('div');
    wrap.className = 'hud-bar hud-bar--stamina';
    wrap.innerHTML = `
      <span class="hud-bar__label" data-stamina-label></span>
      <div class="hud-bar__track"><div class="hud-bar__fill hud-bar__fill--stamina"></div></div>
      <span class="hud-bar__value">100%</span>
    `;
    root.appendChild(wrap);
    this.fillEl = wrap.querySelector('.hud-bar__fill')!;
    this.valueEl = wrap.querySelector('.hud-bar__value')!;
    this.labelEl = wrap.querySelector('[data-stamina-label]')!;
    this.applyLabel();
    registerLocaleRefresh(() => this.applyLabel());
  }

  private applyLabel(): void {
    this.labelEl.textContent = t('hud.stamina');
  }

  update(stamina: number): void {
    const clamped = Math.max(0, Math.min(100, stamina));
    this.fillEl.style.width = `${clamped}%`;
    this.valueEl.textContent = `${Math.round(clamped)}%`;
    this.fillEl.classList.toggle('hud-bar__fill--low', clamped < 30);
  }
}
