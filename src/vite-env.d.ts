/// <reference types="vite/client" />

declare module '*.md?raw' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_FEATURE_ONLINE_LEADERBOARD: string;
  readonly VITE_FEATURE_CLOUD_SAVE: string;
  readonly VITE_FEATURE_GHOST_RACE: string;
  readonly VITE_FEATURE_STORY_MODE: string;
  readonly VITE_FEATURE_DAILY_CHALLENGE: string;
  readonly VITE_ANALYTICS_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
