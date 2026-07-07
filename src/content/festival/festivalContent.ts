import { marked } from 'marked';
import type { Locale } from '@/i18n/types';

import enMd from './en.md?raw';
import viMd from './vi.md?raw';

const CONTENT: Record<Locale, string> = {
  en: enMd,
  vi: viMd,
};

/** Stable section anchors — both locale files must keep the same h2 order. */
export const FESTIVAL_SECTION_IDS = [
  'about',
  'morning',
  'drums',
  'road',
  'teams',
  'tense',
  'finish',
  'why',
  'join',
  'glossary',
] as const;

marked.setOptions({
  gfm: true,
  breaks: false,
});

function assignSectionIds(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = html;
  const headings = template.content.querySelectorAll('h2');
  headings.forEach((heading, index) => {
    const id = FESTIVAL_SECTION_IDS[index];
    if (id) heading.id = id;
  });
  return template.innerHTML;
}

export function renderFestivalHtml(locale: Locale): string {
  const html = marked.parse(CONTENT[locale]) as string;
  return assignSectionIds(html);
}
