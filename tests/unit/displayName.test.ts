import { describe, it, expect } from 'vitest';
import {
  DISPLAY_NAME_MAX_LENGTH,
  sanitizeDisplayName,
  DEFAULT_DISPLAY_NAME,
} from '@/utils/displayName';

describe('sanitizeDisplayName', () => {
  it('trims and limits to 21 characters', () => {
    expect(sanitizeDisplayName('  Hello World  ')).toBe('Hello World');
    expect(sanitizeDisplayName('a'.repeat(30))).toHaveLength(DISPLAY_NAME_MAX_LENGTH);
  });

  it('strips unsafe characters', () => {
    expect(sanitizeDisplayName('<script>alert</script>')).toBe('scriptalert/script');
  });

  it('falls back when empty', () => {
    expect(sanitizeDisplayName('   ')).toBe(DEFAULT_DISPLAY_NAME);
  });

  it('supports Vietnamese names', () => {
    expect(sanitizeDisplayName('Minh Sóc Trang')).toBe('Minh Sóc Trang');
  });
});
