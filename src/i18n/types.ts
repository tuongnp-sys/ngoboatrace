export type Locale = 'en' | 'vi';

export interface LocalizedString {
  en: string;
  vi: string;
}

export type TranslationKey = keyof typeof import('./en').en;
