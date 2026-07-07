export const DISPLAY_NAME_MAX_LENGTH = 21;

export const DEFAULT_DISPLAY_NAME = 'Người chơi';

/** Strip unsafe chars and enforce max length (21 characters). */
export function sanitizeDisplayName(raw: string): string {
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

  return name || DEFAULT_DISPLAY_NAME;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
