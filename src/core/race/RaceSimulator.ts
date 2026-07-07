import { GAME_CONFIG } from '@/config/game.config';
import type {
  AIPersonalityConfig,
  BoatState,
  RaceConfig,
  RaceState,
  TapEvent,
} from '@/types/race.types';
import { createRhythmState, RhythmEngine } from '../rhythm/RhythmEngine';
import { AIController } from '../ai/AIController';
import {
  boostFramesFromMs,
  computeSpeed,
  generateEnvironment,
  getEnvironmentModAt,
  isRainActive,
  isShallowActive,
  penaltyFramesFromMs,
} from './EnvironmentModifier';
import { getPlayerRank, sortByProgress } from './PositionTracker';

const PLAYER_ID = 'player';

export class RaceSimulator {
  private config: RaceConfig;
  private state: RaceState;
  private rhythmEngine: RhythmEngine;
  private rhythmState: ReturnType<typeof createRhythmState>;
  private aiController: AIController;
  private inputLog: TapEvent[] = [];
  private finishOrder: string[] = [];

  constructor(config: RaceConfig, environmentEnabled = true) {
    this.config = config;
    this.rhythmEngine = new RhythmEngine(
      config.bpm,
      config.raceDurationMs,
      config.playerUpgrades?.drum ?? 0,
    );
    this.aiController = new AIController(config.opponents, config.seed);

    const rhythm = createRhythmState(config.playerUpgrades);
    this.rhythmState = rhythm;
    const environment = generateEnvironment(config.seed, environmentEnabled);

    const boats: BoatState[] = [
      {
        id: PLAYER_ID,
        progress: 0,
        speed: 0,
        sync: rhythm.sync,
        stamina: rhythm.stamina,
        isPlayer: true,
        finished: false,
      },
      ...config.opponents.map((opp, i) => ({
        id: `ai-${opp.id}-${i}`,
        progress: 0,
        speed: 0,
        sync: GAME_CONFIG.SYNC_INITIAL,
        stamina: GAME_CONFIG.STAMINA_INITIAL,
        isPlayer: false,
        finished: false,
        personalityId: opp.id,
      })),
    ];

    this.state = {
      frame: 0,
      elapsedMs: 0,
      phase: 'racing',
      boats,
      perfectCount: 0,
      goodCount: 0,
      missCount: 0,
      clutchAvailable: false,
      clutchAttempted: false,
      clutchSuccess: false,
      clutchTaps: 0,
      boostFramesRemaining: 0,
      penaltyFramesRemaining: 0,
      environment,
      recentSyncSamples: [rhythm.sync],
    };
  }

  getState(): RaceState {
    return this.state;
  }

  getInputs(): TapEvent[] {
    return [...this.inputLog];
  }

  getConfig(): RaceConfig {
    return this.config;
  }

  tick(inputs: TapEvent[] = []): import('@/types/race.types').RaceTickOutput {
    if (this.state.phase === 'finished') {
      return { state: this.state, events: [] };
    }

    const events: import('@/types/race.types').RaceEvent[] = [];
    const frame = this.state.frame + 1;
    const elapsedMs = frame * GAME_CONFIG.TICK_MS;

    for (const input of inputs) {
      this.inputLog.push({ ...input, frame });
    }

    const playerBoat = this.getPlayerBoat();
    const rainActive = isRainActive(this.state.environment, playerBoat.progress);

    const rhythmResult = this.rhythmEngine.processInputs(
      this.rhythmState,
      inputs,
      elapsedMs,
      frame,
      rainActive,
    );
    this.rhythmState = rhythmResult.state;

    for (const ev of rhythmResult.events) {
      events.push(ev);
    }

    this.state.perfectCount = rhythmResult.state.perfectCount;
    this.state.goodCount = rhythmResult.state.goodCount;
    this.state.missCount = rhythmResult.state.missCount;

    playerBoat.sync = rhythmResult.state.sync;
    playerBoat.stamina = rhythmResult.state.stamina;
    this.state.recentSyncSamples = [
      ...this.state.recentSyncSamples.slice(-59),
      playerBoat.sync,
    ];

    if (
      playerBoat.sync < GAME_CONFIG.CAPSIZE_SYNC_THRESHOLD &&
      this.state.penaltyFramesRemaining === 0 &&
      rhythmResult.results.includes('miss')
    ) {
      this.state.penaltyFramesRemaining = penaltyFramesFromMs(
        GAME_CONFIG.CAPSIZE_PENALTY_MS,
      );
      events.push({ type: 'CAPSIZE_PENALTY', boatId: PLAYER_ID });
    }

    this.processClutch(inputs, playerBoat, events);

    if (this.state.boostFramesRemaining > 0) {
      this.state.boostFramesRemaining -= 1;
    }
    if (this.state.penaltyFramesRemaining > 0) {
      this.state.penaltyFramesRemaining -= 1;
    }

    const perfectRate = this.getPerfectRate();
    const envMod = getEnvironmentModAt(this.state.environment, playerBoat.progress);
    const boostActive = this.state.boostFramesRemaining > 0;
    const penaltyActive = this.state.penaltyFramesRemaining > 0;

    if (!penaltyActive) {
      playerBoat.speed = computeSpeed({
        sync: playerBoat.sync,
        perfectRate,
        stamina: playerBoat.stamina,
        envMod,
        boostActive,
        boatUpgrade: this.config.playerUpgrades?.boat ?? 0,
      });
      playerBoat.progress = Math.min(1, playerBoat.progress + playerBoat.speed);
    } else {
      playerBoat.speed = 0;
    }

    const shallow = isShallowActive(this.state.environment, playerBoat.progress);
    const hasSteer = inputs.some(
      (i) => i.type === 'swipe_left' || i.type === 'swipe_right',
    );
    if (shallow && !hasSteer) {
      playerBoat.progress = Math.max(0, playerBoat.progress - playerBoat.speed * 0.3);
    }

    this.updateAI(playerBoat);

    for (const boat of this.state.boats) {
      if (!boat.finished && boat.progress >= 1) {
        boat.finished = true;
        boat.finishFrame = frame;
        boat.progress = 1;
        this.finishOrder.push(boat.id);
        events.push({ type: 'BOAT_FINISHED', boatId: boat.id, rank: this.finishOrder.length });
      }
    }

    if (
      !this.state.clutchAvailable &&
      playerBoat.progress >= this.config.clutchProgressThreshold &&
      !playerBoat.finished
    ) {
      this.state.clutchAvailable = true;
      events.push({ type: 'CLUTCH_AVAILABLE' });
    }

    this.state.frame = frame;
    this.state.elapsedMs = elapsedMs;

    if (this.finishOrder.length === this.state.boats.length) {
      this.state.phase = 'finished';
      events.push({ type: 'RACE_FINISHED' });
    } else if (elapsedMs >= this.config.raceDurationMs) {
      this.state.phase = 'finished';
      events.push({ type: 'RACE_FINISHED' });
    }

    return { state: this.state, events };
  }

  runToCompletion(inputProvider?: (frame: number, state: RaceState) => TapEvent[]): RaceState {
    const maxFrames = Math.ceil(this.config.raceDurationMs / GAME_CONFIG.TICK_MS) + 120;

    for (let i = 0; i < maxFrames; i++) {
      const inputs = inputProvider?.(this.state.frame, this.state) ?? [];
      const { state } = this.tick(inputs);
      if (state.phase === 'finished') break;
    }

    return this.state;
  }

  getPlayerRank(): number {
    return getPlayerRank(this.state.boats, PLAYER_ID);
  }

  getAverageSync(): number {
    if (this.state.recentSyncSamples.length === 0) return 0;
    const sum = this.state.recentSyncSamples.reduce((a, b) => a + b, 0);
    return sum / this.state.recentSyncSamples.length;
  }

  private getPlayerBoat(): BoatState {
    return this.state.boats.find((b) => b.isPlayer)!;
  }

  private getPerfectRate(): number {
    const total = this.state.perfectCount + this.state.goodCount + this.state.missCount;
    if (total === 0) return 0;
    return this.state.perfectCount / total;
  }

  private processClutch(
    inputs: TapEvent[],
    _playerBoat: BoatState,
    events: import('@/types/race.types').RaceEvent[],
  ): void {
    if (!this.state.clutchAvailable || this.state.clutchAttempted) return;

    const clutchInputs = inputs.filter((i) => i.type === 'clutch_tap');
    if (clutchInputs.length === 0) return;

    this.state.clutchTaps += clutchInputs.length;

    if (this.state.clutchTaps >= GAME_CONFIG.CLUTCH_REQUIRED_TAPS) {
      this.state.clutchAttempted = true;
      this.state.clutchSuccess = true;
      this.state.boostFramesRemaining = boostFramesFromMs(GAME_CONFIG.BOOST_DURATION_MS);
      events.push({ type: 'CLUTCH_SUCCESS' });
    }
  }

  private updateAI(playerBoat: BoatState): void {
    const leaderProgress = Math.max(...this.state.boats.map((b) => b.progress));

    for (const boat of this.state.boats) {
      if (boat.isPlayer || boat.finished) continue;

      const personality = this.config.opponents.find((o) => o.id === boat.personalityId);
      if (!personality) continue;

      const aiSpeed = this.aiController.computeSpeed({
        personality,
        progress: boat.progress,
        raceProgress: leaderProgress,
        playerProgress: playerBoat.progress,
        frame: this.state.frame,
        totalFrames: Math.ceil(this.config.raceDurationMs / GAME_CONFIG.TICK_MS),
      });

      const envMod = getEnvironmentModAt(this.state.environment, boat.progress);
      boat.speed = aiSpeed + envMod * GAME_CONFIG.BASE_SPEED;
      boat.progress = Math.min(1, boat.progress + boat.speed);
      boat.sync = Math.min(100, 50 + aiSpeed * 50000);
    }
  }
}

export function createDefaultRaceConfig(
  seed: number,
  opponentIds: string[],
  teams: AIPersonalityConfig[],
): RaceConfig {
  const opponents = opponentIds
    .map((id) => teams.find((t) => t.id === id))
    .filter((t): t is AIPersonalityConfig => t !== undefined);

  return {
    seed,
    trackLength: GAME_CONFIG.DEFAULT_TRACK_LENGTH,
    bpm: GAME_CONFIG.DEFAULT_BPM,
    raceDurationMs: GAME_CONFIG.DEFAULT_RACE_DURATION_MS,
    opponents,
    clutchProgressThreshold: GAME_CONFIG.CLUTCH_PROGRESS_THRESHOLD,
    playerUpgrades: { boat: 0, crew: 0, drum: 0 },
  };
}

export { sortByProgress };
