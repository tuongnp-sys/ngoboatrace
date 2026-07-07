function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
}

export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  appVersion: import.meta.env.VITE_APP_VERSION ?? '0.1.0',
  features: {
    onlineLeaderboard: parseBool(import.meta.env.VITE_FEATURE_ONLINE_LEADERBOARD, true),
    cloudSave: parseBool(import.meta.env.VITE_FEATURE_CLOUD_SAVE, true),
    ghostRace: parseBool(import.meta.env.VITE_FEATURE_GHOST_RACE, false),
    storyMode: parseBool(import.meta.env.VITE_FEATURE_STORY_MODE, true),
    dailyChallenge: parseBool(import.meta.env.VITE_FEATURE_DAILY_CHALLENGE, true),
  },
  analyticsId: import.meta.env.VITE_ANALYTICS_ID ?? '',
} as const;
