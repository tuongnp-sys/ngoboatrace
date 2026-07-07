/** Seed thử thách daily — dùng chung client & server */
export function getDailySeed(dateKey: string): number {
  return [...dateKey].reduce((acc, c) => acc + c.charCodeAt(0), 0) * 997 % 1_000_000;
}

export const DAILY_MAX_MISSES = 5;

export const DAILY_OPPONENT_IDS = ['tra-vinh', 'ca-mau', 'can-tho'] as const;
