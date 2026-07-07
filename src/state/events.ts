import type { RacePhase } from '@/types/race.types';

export type AppScreen =
  | 'home'
  | 'festival'
  | 'team_select'
  | 'story'
  | 'race'
  | 'result'
  | 'settings'
  | 'leaderboard';

export type GameEventMap = {
  'screen:change': { screen: AppScreen };
  'locale:change': { locale: 'en' | 'vi' };
  'race:prepare': { mode: 'quick' | 'story' | 'daily'; chapterId?: number; teamId?: string };
  'race:start': { seed: number };
  'race:finish': { rank: number };
  'network:status': { online: boolean };
  'sync:complete': { count: number };
};

type Listener<T> = (payload: T) => void;

export class EventBus<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<Listener<unknown>>>();

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<unknown>);
    return () => this.off(event, listener);
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.listeners.get(event)?.forEach((fn) => fn(payload));
  }
}

export const gameEvents = new EventBus<GameEventMap>();

export interface StateMachineState {
  screen: AppScreen;
  racePhase: RacePhase | null;
}

export class GameStateMachine {
  private state: StateMachineState = { screen: 'home', racePhase: null };

  getState(): StateMachineState {
    return { ...this.state };
  }

  transition(screen: AppScreen, racePhase: RacePhase | null = null): void {
    this.state = { screen, racePhase };
    gameEvents.emit('screen:change', { screen });
  }
}
