import { SupportedLanguageCode, LanguageDefinition } from '@/services/translation/translation.types';

export type LanguageConfig = LanguageDefinition;

export const SUPPORTED_LANGUAGES: Record<SupportedLanguageCode, LanguageDefinition> = {
  en: {
    code: 'en',
    englishName: 'English',
    displayName: 'English',
    nativeName: 'English',
    locale: 'en-IN',
    isRtlText: false,
  },
  te: {
    code: 'te',
    englishName: 'Telugu',
    displayName: 'Telugu',
    nativeName: 'తెలుగు',
    locale: 'te-IN',
    isRtlText: false,
  },
  hi: {
    code: 'hi',
    englishName: 'Hindi',
    displayName: 'Hindi',
    nativeName: 'हिन्दी',
    locale: 'hi-IN',
    isRtlText: false,
  },
  ta: {
    code: 'ta',
    englishName: 'Tamil',
    displayName: 'Tamil',
    nativeName: 'தமிழ்',
    locale: 'ta-IN',
    isRtlText: false,
  },
  kn: {
    code: 'kn',
    englishName: 'Kannada',
    displayName: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    locale: 'kn-IN',
    isRtlText: false,
  },
  ml: {
    code: 'ml',
    englishName: 'Malayalam',
    displayName: 'Malayalam',
    nativeName: 'മലയാളം',
    locale: 'ml-IN',
    isRtlText: false,
  },
  ur: {
    code: 'ur',
    englishName: 'Urdu',
    displayName: 'Urdu',
    nativeName: 'اردو',
    locale: 'ur-PK',
    isRtlText: true,
  },
  ar: {
    code: 'ar',
    englishName: 'Arabic',
    displayName: 'Arabic',
    nativeName: 'العربية',
    locale: 'ar-SA',
    isRtlText: true,
  },
};

export const DEFAULT_LANGUAGE: SupportedLanguageCode = 'en';

export const getLanguageConfig = (code?: string): LanguageDefinition => {
  if (!code) return SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
  const normalized = code.toLowerCase().split(/[-_]/)[0] as SupportedLanguageCode;
  return SUPPORTED_LANGUAGES[normalized] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
};
