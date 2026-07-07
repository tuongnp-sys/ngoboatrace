import { crossedBeatBoundary } from '@/core/rhythm/BeatMap';
import { GAME_CONFIG } from '@/config/game.config';
import type { RaceController } from '@/game/RaceController';
import type { RaceState } from '@/types/race.types';
import {
  applyI18n,
  formatJudgeStats,
  registerLocaleRefresh,
  t,
} from '@/i18n';
import { SyncBar } from './SyncBar';
import { StaminaBar } from './StaminaBar';

export type FinishReviewMode = 'arrived' | 'timeout';

export class RaceHUD {
  readonly element: HTMLElement;
  private syncBar: SyncBar;
  private staminaBar: StaminaBar;
  private beatRing: HTMLElement;
  private judgeFlash: HTMLElement;
  private clutchBanner: HTMLElement;
  private clutchText: HTMLElement;
  private tapZone: HTMLElement;
  private tapHint: HTMLElement;
  private countdownEl: HTMLElement;
  private statsEl: HTMLElement;
  private finishReviewEl: HTMLElement;
  private finishReviewTitle: HTMLElement;
  private continueBtn: HTMLButtonElement;
  private controller: RaceController | null = null;
  private holdStart = 0;
  private frozen = false;
  private finishReviewMode: FinishReviewMode | null = null;
  private lastStats = { perfect: 0, good: 0, miss: 0 };
  private onContinue: (() => void) | null = null;
  private localeUnsub: (() => void) | null = null;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'race-hud';
    this.element.innerHTML = `
      <div class="race-hud__top">
        <div id="hud-bars"></div>
        <div class="race-hud__stats" id="hud-stats"></div>
      </div>
      <div class="race-hud__countdown" id="hud-countdown"></div>
      <div class="race-hud__clutch" id="hud-clutch" hidden>
        <span id="hud-clutch-text"></span>
        <div class="clutch-progress"><div class="clutch-progress__fill"></div></div>
      </div>
      <div class="race-hud__tap" id="hud-tap-zone">
        <div class="beat-ring" id="beat-ring"></div>
        <div class="judge-flash" id="judge-flash"></div>
        <span class="tap-hint" id="tap-hint"></span>
      </div>
      <div class="race-hud__finish-review" id="hud-finish-review" hidden>
        <p class="finish-review__title" id="finish-review-title"></p>
        <p class="finish-review__hint" id="finish-review-hint" data-i18n="race.finish.hint" data-i18n-html="true"></p>
        <button type="button" class="btn btn-primary finish-review__btn" id="btn-finish-continue" data-i18n="race.continue"></button>
      </div>
    `;

    const barsRoot = this.element.querySelector('#hud-bars') as HTMLElement;
    this.syncBar = new SyncBar(barsRoot);
    this.staminaBar = new StaminaBar(barsRoot);
    this.beatRing = this.element.querySelector('#beat-ring') as HTMLElement;
    this.judgeFlash = this.element.querySelector('#judge-flash') as HTMLElement;
    this.clutchBanner = this.element.querySelector('#hud-clutch') as HTMLElement;
    this.clutchText = this.element.querySelector('#hud-clutch-text') as HTMLElement;
    this.tapZone = this.element.querySelector('#hud-tap-zone') as HTMLElement;
    this.tapHint = this.element.querySelector('#tap-hint') as HTMLElement;
    this.countdownEl = this.element.querySelector('#hud-countdown') as HTMLElement;
    this.statsEl = this.element.querySelector('#hud-stats') as HTMLElement;
    this.finishReviewEl = this.element.querySelector('#hud-finish-review') as HTMLElement;
    this.finishReviewTitle = this.element.querySelector('#finish-review-title') as HTMLElement;
    this.continueBtn = this.element.querySelector('#btn-finish-continue') as HTMLButtonElement;

    this.continueBtn.addEventListener('click', () => this.onContinue?.());
    this.bindTapZone();
    this.applyLocale();
    this.localeUnsub = registerLocaleRefresh(() => this.applyLocale());
  }

  bindController(controller: RaceController): void {
    this.controller = controller;
  }

  showCountdown(value: number | string): void {
    this.countdownEl.textContent = String(value);
    this.countdownEl.classList.add('race-hud__countdown--active');
  }

  hideCountdown(): void {
    this.countdownEl.textContent = '';
    this.countdownEl.classList.remove('race-hud__countdown--active');
  }

  showFinishReview(mode: FinishReviewMode, onContinue: () => void): void {
    this.frozen = true;
    this.finishReviewMode = mode;
    this.onContinue = onContinue;
    this.tapZone.hidden = true;
    this.clutchBanner.hidden = true;
    this.finishReviewEl.hidden = false;
    this.applyLocale();
  }

  updateFromState(state: RaceState): void {
    const player = state.boats.find((b) => b.isPlayer);
    if (!player) return;

    this.syncBar.update(player.sync);
    this.staminaBar.update(player.stamina);
    this.lastStats = {
      perfect: state.perfectCount,
      good: state.goodCount,
      miss: state.missCount,
    };
    this.statsEl.textContent = formatJudgeStats(
      state.perfectCount,
      state.goodCount,
      state.missCount,
    );

    if (this.frozen) return;

    if (state.clutchAvailable && !state.clutchAttempted) {
      this.clutchBanner.hidden = false;
      this.tapZone.classList.add('race-hud__tap--clutch');
      const fill = this.clutchBanner.querySelector('.clutch-progress__fill') as HTMLElement;
      fill.style.width = `${(state.clutchTaps / GAME_CONFIG.CLUTCH_REQUIRED_TAPS) * 100}%`;
    } else {
      this.clutchBanner.hidden = true;
      this.tapZone.classList.remove('race-hud__tap--clutch');
    }
  }

  flashJudge(result: 'perfect' | 'good' | 'miss'): void {
    if (this.frozen) return;
    this.judgeFlash.textContent = t(`judge.${result}`);
    this.judgeFlash.className = `judge-flash judge-flash--${result} judge-flash--show`;
    setTimeout(() => {
      this.judgeFlash.classList.remove('judge-flash--show');
    }, 200);
  }

  syncBeat(elapsedMs: number, bpm: number, prevElapsedMs: number): void {
    if (this.frozen || !this.canAcceptInput()) return;
    if (crossedBeatBoundary(prevElapsedMs, elapsedMs, bpm)) {
      this.pulseBeat();
    }
  }

  applyLocale(): void {
    this.tapHint.textContent = t('race.tapHint');
    this.clutchText.textContent = t('race.clutch', {
      count: GAME_CONFIG.CLUTCH_REQUIRED_TAPS,
    });
    this.statsEl.textContent = formatJudgeStats(
      this.lastStats.perfect,
      this.lastStats.good,
      this.lastStats.miss,
    );

    if (this.finishReviewMode) {
      this.finishReviewTitle.textContent = t(
        this.finishReviewMode === 'arrived' ? 'race.finish.arrived' : 'race.finish.timeout',
      );
    }

    applyI18n(this.finishReviewEl);
  }

  destroy(): void {
    this.localeUnsub?.();
    this.element.remove();
  }

  private canAcceptInput(): boolean {
    return (
      !!this.controller?.isStarted() &&
      !this.controller.isFinished() &&
      !this.frozen
    );
  }

  private bindTapZone(): void {
    const submitTap = (duration: number): void => {
      if (!this.controller || !this.canAcceptInput()) return;

      const state = this.controller.getState();
      const isClutch = state.clutchAvailable && !state.clutchAttempted;

      if (duration >= 1000 && !isClutch) {
        this.controller.queueInput('hold', duration);
      } else if (isClutch) {
        this.controller.queueInput('clutch_tap');
      } else {
        this.controller.queueInput('tap');
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!this.canAcceptInput()) return;
      e.preventDefault();
      e.stopPropagation();
      this.holdStart = Date.now();
      this.tapZone.setPointerCapture(e.pointerId);
      this.beatRing.classList.add('beat-ring--touch');
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!this.controller?.isStarted() || this.frozen) return;
      e.preventDefault();
      e.stopPropagation();
      this.beatRing.classList.remove('beat-ring--touch');

      const duration = Date.now() - this.holdStart;
      submitTap(duration);

      if (this.tapZone.hasPointerCapture(e.pointerId)) {
        this.tapZone.releasePointerCapture(e.pointerId);
      }
    };

    this.tapZone.addEventListener('pointerdown', onPointerDown);
    this.tapZone.addEventListener('pointerup', onPointerUp);
    this.tapZone.addEventListener('pointercancel', onPointerUp);
  }

  private pulseBeat(): void {
    if (!this.canAcceptInput()) return;
    this.beatRing.classList.remove('beat-ring--pulse');
    void this.beatRing.offsetWidth;
    this.beatRing.classList.add('beat-ring--pulse');
  }
}
