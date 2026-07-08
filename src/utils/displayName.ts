import { t } from '@/i18n';

export const DISPLAY_NAME_MAX_LENGTH = 21;

/** Built-in default names — keep in sync with i18n `profile.defaultName`. */
export const DISPLAY_NAME_DEFAULTS = {
  en: 'Player',
  vi: 'Người chơi',
} as const;

/** Neutral fallback when the server has no client locale context. */
export const SERVER_DEFAULT_DISPLAY_NAME = DISPLAY_NAME_DEFAULTS.en;

export function isLocaleDefaultDisplayName(name: string): boolean {
  return name === DISPLAY_NAME_DEFAULTS.en || name === DISPLAY_NAME_DEFAULTS.vi;
}

export function getDefaultDisplayName(): string {
  return t('profile.defaultName');
}

/** If the user still has the other locale's default, switch to the current locale. */
export function localizeDefaultDisplayName(current: string): string {
  if (isLocaleDefaultDisplayName(current) && current !== getDefaultDisplayName()) {
    return getDefaultDisplayName();
  }
  return current;
}

/** Strip unsafe chars and enforce max length (21 characters). */
export function sanitizeDisplayName(raw: string, fallback?: string): string {
  let name = raw
    .replace(/[<>&]/g, '')
    .replace(/['"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  name = [...name].filter((ch) => ch.charCodeAt(0) > 31).join('');

  const chars = [...name];
  if (chars.length > DISPLAY_NAME_MAX_LENGTH) {
    name = chars.slice(0, DISPLAY_NAME_MAX_LENGTH).join('');
  }

  const fb = fallback ?? getDefaultDisplayName();
  return name || fb;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
