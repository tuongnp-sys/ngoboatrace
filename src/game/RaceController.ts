import type { InputType, RaceConfig, RaceState, TapEvent, RaceTickOutput } from '@/types/race.types';
import { RaceSimulator } from '@/core/race/RaceSimulator';
import { calculatePerfectRate } from '@/core/scoring/ScoreCalculator';
import { encodeReplay } from '@/core/scoring/ReplayEncoder';
import type { RaceResult } from '@/types/race.types';

export class RaceController {
  private sim: RaceSimulator;
  private pendingInputs: TapEvent[] = [];
  private started = false;
  private environmentEnabled: boolean;

  constructor(config: RaceConfig, environmentEnabled = true) {
    this.sim = new RaceSimulator(config, environmentEnabled);
    this.environmentEnabled = environmentEnabled;
  }

  start(): void {
    this.started = true;
  }

  isStarted(): boolean {
    return this.started;
  }

  getConfig(): RaceConfig {
    return this.sim.getConfig();
  }

  getState(): RaceState {
    return this.sim.getState();
  }

  queueInput(type: InputType, holdDurationMs?: number): void {
    if (!this.started) return;
    const frame = this.sim.getState().frame;
    this.pendingInputs.push({ frame, type, holdDurationMs });
  }

  tick(): RaceTickOutput {
    if (!this.started) return { state: this.sim.getState(), events: [] };
    const inputs = this.pendingInputs.splice(0);
    return this.sim.tick(inputs);
  }

  isFinished(): boolean {
    return this.sim.getState().phase === 'finished';
  }

  allBoatsFinished(): boolean {
    return this.getState().boats.every((b) => b.finished);
  }

  getResult(): RaceResult {
    const state = this.sim.getState();
    const config = this.sim.getConfig();
    const inputs = this.sim.getInputs();
    const replay = encodeReplay(config, inputs);

    return {
      rank: this.sim.getPlayerRank(),
      totalBoats: state.boats.length,
      perfectRate: calculatePerfectRate(state),
      syncAvg: this.sim.getAverageSync(),
      durationMs: state.elapsedMs,
      clutchSuccess: state.clutchSuccess,
      replay,
    };
  }

  getEnvironmentEnabled(): boolean {
    return this.environmentEnabled;
  }
}
