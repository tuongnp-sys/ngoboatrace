import type { BoatState } from '@/types/race.types';

export function getFinishRank(boatId: string, boats: BoatState[]): number | null {
  const boat = boats.find((b) => b.id === boatId);
  if (!boat?.finished) return null;

  const order = [...boats]
    .filter((b) => b.finished)
    .sort((a, b) => (a.finishFrame ?? 0) - (b.finishFrame ?? 0));

  const idx = order.findIndex((b) => b.id === boatId);
  return idx >= 0 ? idx + 1 : null;
}

export function getRankColor(rank: number): string {
  switch (rank) {
    case 1:
      return '#ffd700';
    case 2:
      return '#e8e8e8';
    case 3:
      return '#cd7f32';
    default:
      return '#94a3b8';
  }
}

export function getRankLabel(rank: number): string {
  if (rank === 1) return '🥇 1';
  if (rank === 2) return '🥈 2';
  if (rank === 3) return '🥉 3';
  if (rank === 4) return '4️⃣';
  return `#${rank}`;
}
