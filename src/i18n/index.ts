import { en } from './en';
import { vi } from './vi';
import { gameEvents } from '@/state/events';
import type { Locale, LocalizedString, TranslationKey } from './types';

const STORAGE_KEY = 'ngoboatrace_locale';

const catalogs = { en, vi } as const;

let locale: Locale = 'en';

const refreshers = new Set<() => void>();

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'vi') return stored;
  } catch {
    /* ignore */
  }
  return 'en';
}

export function initLocale(): void {
  locale = readStoredLocale();
  document.documentElement.lang = locale;
}

export function getLocale(): Locale {
  return locale;
}

export function setLocale(next: Locale): void {
  if (next === locale) return;
  locale = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = next;
  gameEvents.emit('locale:change', { locale: next });
  refreshers.forEach((fn) => fn());
}

export function toggleLocale(): void {
  setLocale(locale === 'en' ? 'vi' : 'en');
}

export function t(
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const catalog = catalogs[locale];
  let text = catalog[key] ?? catalogs.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

export function tL(value: LocalizedString): string {
  return value[locale];
}

export function registerLocaleRefresh(fn: () => void): () => void {
  refreshers.add(fn);
  return () => refreshers.delete(fn);
}

export function formatJudgeStats(perfect: number, good: number, miss: number): string {
  return `${t('judge.perfect')}: ${perfect} · ${t('judge.good')}: ${good} · ${t('judge.miss')}: ${miss}`;
}

export function getChapterTitle(id: number): string {
  return t(`chapter.${id}.title` as TranslationKey);
}

export function getChapterSubtitle(id: number): string {
  return t(`chapter.${id}.subtitle` as TranslationKey);
}

export function getTeamMotto(teamId: string): string {
  const key = `team.${teamId}.motto` as TranslationKey;
  return t(key);
}

export function applyI18n(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n as TranslationKey | undefined;
    if (!key) return;
    const params: Record<string, string | number> = {};
    if (el.dataset.i18nVersion) params.version = el.dataset.i18nVersion;
    if (el.dataset.i18nCurrent) params.current = el.dataset.i18nCurrent;
    if (el.dataset.i18nId) params.id = el.dataset.i18nId;
    if (el.dataset.i18nCount) params.count = el.dataset.i18nCount;
    if (el.dataset.i18nScreen) params.screen = el.dataset.i18nScreen;
    if (el.dataset.i18nRank) params.rank = el.dataset.i18nRank;
    if (el.dataset.i18nTotal) params.total = el.dataset.i18nTotal;
    if (el.dataset.i18nCode) params.code = el.dataset.i18nCode;
    if (el.dataset.i18nScore) params.score = el.dataset.i18nScore;
    if (el.dataset.i18nClutch) params.count = el.dataset.i18nClutch;

    const html = el.dataset.i18nHtml === 'true';
    const text = t(key, params);
    if (html) {
      el.innerHTML = text;
    } else {
      el.textContent = text;
    }
  });
}
