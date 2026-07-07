import type { BoatState } from '@/types/race.types';

export function sortByProgress(boats: BoatState[]): BoatState[] {
  return [...boats].sort((a, b) => {
    if (a.finished && b.finished) {
      return (a.finishFrame ?? 0) - (b.finishFrame ?? 0);
    }
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.progress - a.progress;
  });
}

export function getPlayerRank(boats: BoatState[], playerId: string): number {
  const sorted = sortByProgress(boats);
  const index = sorted.findIndex((b) => b.id === playerId);
  return index === -1 ? boats.length : index + 1;
}

export function getLeaderProgress(boats: BoatState[]): number {
  return Math.max(...boats.map((b) => b.progress), 0);
}
