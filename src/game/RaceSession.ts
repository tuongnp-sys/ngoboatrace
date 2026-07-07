import { GAME_CONFIG } from '@/config/game.config';
import { getChapter } from '@/config/chapters.config';
import { TEAMS } from '@/config/teams.config';
import { createDefaultRaceConfig } from '@/core/race/RaceSimulator';
import { RaceController } from '@/game/RaceController';
import { drumAudio } from '@/services/audio/DrumAudioService';
import { syncManager } from '@/services/sync/SyncManager';
import { playerStore } from '@/state/stores/playerStore';
import { gameEvents } from '@/state/events';
import { t, registerLocaleRefresh } from '@/i18n';
import type { RaceResult } from '@/types/race.types';
import { RaceHUD } from '@/ui/components/RaceHUD';
import { ResultScreen } from '@/ui/screens/ResultScreen';
import type Phaser from 'phaser';

const QUICK_OPPONENTS = ['tra-vinh', 'ca-mau', 'can-tho'];

export interface RaceStartOptions {
  teamId: string;
  mode: 'quick' | 'story' | 'daily';
  chapterId?: number;
  seed?: number;
}

export class RaceSession {
  private container: HTMLElement | null = null;
  private phaserParent: HTMLElement | null = null;
  private game: Phaser.Game | null = null;
  private controller: RaceController | null = null;
  private hud: RaceHUD | null = null;
  private pollId: number | null = null;
  private onComplete: (result: RaceResult) => void;
  private options: RaceStartOptions;
  private lastPerfect = 0;
  private lastGood = 0;
  private lastMiss = 0;
  private lastElapsedMs = 0;
  private reviewingFinish = false;
  private finishing = false;
  private onEscapeKey: ((e: KeyboardEvent) => void) | null = null;
  private loadingLocaleUnsub: (() => void) | null = null;

  constructor(options: RaceStartOptions, onComplete: (result: RaceResult) => void) {
    this.options = options;
    this.onComplete = onComplete;
  }

  start(root: HTMLElement): void {
    const profile = playerStore.get();
    const chapter = this.options.chapterId ? getChapter(this.options.chapterId) : null;

    const opponentIds = chapter?.opponentIds ?? QUICK_OPPONENTS;
    const seed = this.options.seed ?? Date.now() % 1_000_000;
    const environmentEnabled = chapter?.environmentEnabled ?? true;

    const config = createDefaultRaceConfig(seed, opponentIds, TEAMS);
    config.raceDurationMs =
      this.options.mode === 'story' ? GAME_CONFIG.DEFAULT_RACE_DURATION_MS : GAME_CONFIG.QUICK_RACE_DURATION_MS;
    config.playerUpgrades = profile.upgrades;

    this.controller = new RaceController(config, environmentEnabled);

    this.container = document.createElement('div');
    this.container.className = 'race-session';

    this.phaserParent = document.createElement('div');
    this.phaserParent.className = 'race-session__canvas';
    this.phaserParent.id = 'phaser-parent';

    this.hud = new RaceHUD();
    this.hud.bindController(this.controller);

    this.container.appendChild(this.phaserParent);
    this.container.appendChild(this.hud.element);

    const loading = document.createElement('div');
    loading.className = 'race-loading';
    loading.textContent = t('race.loading');
    this.loadingLocaleUnsub = registerLocaleRefresh(() => {
      loading.textContent = t('race.loading');
    });
    this.container.appendChild(loading);
    root.appendChild(this.container);

    void this.bootPhaser(loading);
  }

  private async bootPhaser(loading: HTMLElement): Promise<void> {
    const { createPhaserGame } = await import('@/game/Game');
    const { waitForLayout } = await import('@/utils/phaserWebGLFix');
    if (!this.phaserParent || !this.controller || !this.hud) return;

    await waitForLayout();
    await drumAudio.resume();

    loading.remove();
    this.game = createPhaserGame(this.phaserParent);
    await this.waitForTextures();
    this.startCountdown();
  }

  destroy(): void {
    drumAudio.stop();
    this.loadingLocaleUnsub?.();
    this.loadingLocaleUnsub = null;
    if (this.pollId !== null) cancelAnimationFrame(this.pollId);
    if (this.onEscapeKey) {
      window.removeEventListener('keydown', this.onEscapeKey);
      this.onEscapeKey = null;
    }
    this.hud?.destroy();
    if (this.game) {
      void import('@/game/Game').then(({ destroyPhaserGame }) => destroyPhaserGame(this.game));
    }
    this.game = null;
    this.controller = null;
    this.container?.remove();
    this.container = null;
  }

  private waitForTextures(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => {
        if (this.game?.registry.get('texturesReady')) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  private startCountdown(): void {
    if (!this.controller || !this.hud) return;

    const counts = ['3', '2', '1', 'GO!'];
    let i = 0;
    this.hud.showCountdown(counts[0]!);

    const interval = setInterval(() => {
      i += 1;
      if (i < counts.length) {
        this.hud?.showCountdown(counts[i]!);
      } else {
        clearInterval(interval);
        this.hud?.hideCountdown();
        this.beginRace();
      }
    }, 800);
  }

  private beginRace(): void {
    if (!this.controller || !this.game || !this.hud) return;

    this.controller.start();
    this.lastPerfect = 0;
    this.lastGood = 0;
    this.lastMiss = 0;
    this.lastElapsedMs = 0;

    drumAudio.start(this.controller.getConfig().bpm);

    this.game.scene.start('RaceScene', {
      controller: this.controller,
      playerTeamId: this.options.teamId,
    });

    this.syncHud();
    this.pollFinish();
  }

  private syncHud(): void {
    if (!this.controller || !this.hud) return;
    const state = this.controller.getState();
    const bpm = this.controller.getConfig().bpm;
    const elapsed = state.elapsedMs;

    if (this.controller.isStarted() && !this.controller.isFinished()) {
      drumAudio.sync(elapsed);
      this.hud.syncBeat(elapsed, bpm, this.lastElapsedMs);
    }
    this.lastElapsedMs = elapsed;

    this.hud.updateFromState(state);

    if (state.perfectCount > this.lastPerfect) {
      this.hud.flashJudge('perfect');
      drumAudio.playAccent();
      this.lastPerfect = state.perfectCount;
    } else if (state.goodCount > this.lastGood) {
      this.hud.flashJudge('good');
      this.lastGood = state.goodCount;
    } else if (state.missCount > this.lastMiss) {
      this.hud.flashJudge('miss');
      this.lastMiss = state.missCount;
    }
  }

  private pollFinish(): void {
    const loop = () => {
      if (!this.controller) return;

      this.syncHud();

      if (this.controller.isFinished()) {
        if (!this.reviewingFinish) {
          if (this.controller.allBoatsFinished()) {
            this.enterFinishReview('arrived');
          } else {
            void this.finishRace();
          }
        }
        this.pollId = requestAnimationFrame(loop);
        return;
      }

      this.pollId = requestAnimationFrame(loop);
    };

    this.pollId = requestAnimationFrame(loop);
  }

  private enterFinishReview(mode: 'arrived' | 'timeout'): void {
    if (!this.controller || !this.hud) return;

    this.reviewingFinish = true;
    drumAudio.stop();
    this.game?.registry.set('raceFrozen', true);

    this.hud.showFinishReview(mode, () => {
      void this.finishRace();
    });

    this.onEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        void this.finishRace();
      }
    };
    window.addEventListener('keydown', this.onEscapeKey);
  }

  private async finishRace(): Promise<void> {
    if (this.finishing || !this.controller) return;
    this.finishing = true;

    if (this.onEscapeKey) {
      window.removeEventListener('keydown', this.onEscapeKey);
      this.onEscapeKey = null;
    }

    const result = this.controller.getResult();
    const config = this.controller.getConfig();
    const raceKey =
      this.options.mode === 'story' && this.options.chapterId
        ? `story-${this.options.chapterId}`
        : undefined;

    const raceConfig = {
      seed: config.seed,
      opponentIds: config.opponents.map((o) => o.id),
      raceDurationMs: config.raceDurationMs,
      environmentEnabled: this.controller.getEnvironmentEnabled(),
      playerUpgrades: config.playerUpgrades,
    };

    void playerStore.recordRaceResult(result.rank, result.perfectRate, raceKey);
    const leaderboard = await syncManager.submitScore(result, this.options.mode, raceConfig);
    await syncManager.saveProgress();

    gameEvents.emit('race:finish', { rank: result.rank });
    this.destroy();
    this.onComplete({ ...result, leaderboard });
  }

  static showResult(root: HTMLElement, result: RaceResult, onRetry: () => void): void {
    const screen = new ResultScreen(result, onRetry);
    root.appendChild(screen.render());
  }
}
