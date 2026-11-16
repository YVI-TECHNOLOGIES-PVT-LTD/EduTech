/**
 * Central Translation Types for EduTrack ERP Dynamic Multi-Language Architecture
 */

export type SupportedLanguageCode = 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'ml' | 'ur' | 'ar';

export interface LanguageDefinition {
  code: SupportedLanguageCode;
  englishName: string;
  displayName: string;
  nativeName: string;
  locale: string;
  isRtlText: boolean;
}

export interface TranslationRequest {
  text: string;
  sourceLang?: SupportedLanguageCode;
  targetLang: SupportedLanguageCode;
  format?: 'text' | 'html';
}

export interface BatchTranslationRequest {
  texts: string[];
  sourceLang?: SupportedLanguageCode;
  targetLang: SupportedLanguageCode;
  format?: 'text' | 'html';
}

export interface TranslationResponse {
  translatedText: string;
  sourceLang: SupportedLanguageCode;
  targetLang: SupportedLanguageCode;
  fromCache?: boolean;
  fromGlossary?: boolean;
}

export interface TranslationCacheEntry {
  text: string;
  targetLang: string;
  translatedText: string;
  timestamp: number;
}

export interface TranslationClientConfig {
  apiUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
}

export type InterpolationParams = Record<string, string | number | boolean | null | undefined>;

export type GlossaryDictionary = Record<string, Partial<Record<SupportedLanguageCode, string>>>;
