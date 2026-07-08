import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_DEFAULTS,
  sanitizeDisplayName,
  isLocaleDefaultDisplayName,
  localizeDefaultDisplayName,
} from '@/utils/displayName';
import { initLocale, setLocale } from '@/i18n';

function mockBrowserLocale(): void {
  vi.stubGlobal('document', { documentElement: { lang: 'en' } });
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
  });
}

describe('sanitizeDisplayName', () => {
  beforeEach(() => {
    mockBrowserLocale();
    initLocale();
    setLocale('en');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('trims and limits to 21 characters', () => {
    expect(sanitizeDisplayName('  Hello World  ')).toBe('Hello World');
    expect(sanitizeDisplayName('a'.repeat(30))).toHaveLength(DISPLAY_NAME_MAX_LENGTH);
  });

  it('strips unsafe characters', () => {
    expect(sanitizeDisplayName('<script>alert</script>')).toBe('scriptalert/script');
  });

  it('falls back to locale default when empty', () => {
    expect(sanitizeDisplayName('   ')).toBe(DISPLAY_NAME_DEFAULTS.en);
    setLocale('vi');
    expect(sanitizeDisplayName('   ')).toBe(DISPLAY_NAME_DEFAULTS.vi);
  });

  it('supports Vietnamese names', () => {
    expect(sanitizeDisplayName('Minh Sóc Trang')).toBe('Minh Sóc Trang');
  });
});

describe('localizeDefaultDisplayName', () => {
  beforeEach(() => {
    mockBrowserLocale();
    initLocale();
    setLocale('en');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps Vietnamese default to English when locale is EN', () => {
    expect(localizeDefaultDisplayName(DISPLAY_NAME_DEFAULTS.vi)).toBe(DISPLAY_NAME_DEFAULTS.en);
  });

  it('maps English default to Vietnamese when locale is VN', () => {
    setLocale('vi');
    expect(localizeDefaultDisplayName(DISPLAY_NAME_DEFAULTS.en)).toBe(DISPLAY_NAME_DEFAULTS.vi);
  });

  it('keeps custom names unchanged', () => {
    expect(localizeDefaultDisplayName('Captain Soc Trang')).toBe('Captain Soc Trang');
  });

  it('detects built-in defaults', () => {
    expect(isLocaleDefaultDisplayName('Player')).toBe(true);
    expect(isLocaleDefaultDisplayName('Người chơi')).toBe(true);
    expect(isLocaleDefaultDisplayName('abc')).toBe(false);
  });
});
