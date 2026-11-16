import {
  SupportedLanguageCode,
  InterpolationParams,
} from './translation.types';
import { TranslationProtector } from './TranslationProtector';
import { TranslationCache } from './TranslationCache';
import { LibreTranslateClient } from './LibreTranslateClient';
import { lookupGlossary } from './TranslationGlossary';

type TranslationChangeListener = (key: string, translatedText: string, targetLang: string) => void;

/**
 * TranslationManager
 *
 * Central coordinator for the EduTrack dynamic multi-language translation architecture.
 * Manages cache lookup, controlled glossary matching, request deduplication, value protection,
 * and background/batched dynamic translation.
 */
export class TranslationManager {
  private static instance: TranslationManager;

  private cache: TranslationCache;
  private client: LibreTranslateClient;
  private inFlightRequests: Map<string, Promise<string>> = new Map();
  private listeners: Set<TranslationChangeListener> = new Set();

  private constructor() {
    this.cache = new TranslationCache();
    this.client = new LibreTranslateClient();
  }

  public static getInstance(): TranslationManager {
    if (!TranslationManager.instance) {
      TranslationManager.instance = new TranslationManager();
    }
    return TranslationManager.instance;
  }

  /**
   * Subscribe to background translation completion events.
   */
  public subscribe(listener: TranslationChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(key: string, translatedText: string, targetLang: string): void {
    this.listeners.forEach((listener) => {
      try {
        listener(key, translatedText, targetLang);
      } catch {
        // Ignore subscriber errors
      }
    });
  }

  /**
   * Synchronous translation method for React component render functions.
   *
   * Fast resolution path:
   * 1. If target is 'en', returns interpolated text immediately.
   * 2. Checks L1 memory cache.
   * 3. Checks controlled glossary.
   * 4. Checks L2 persistent cache.
   * 5. If uncached and LibreTranslate is configured: schedules background translation
   *    and returns source English text immediately without blocking UI.
   */
  public translateSync(
    text: string,
    targetLang: SupportedLanguageCode,
    params?: InterpolationParams,
    sourceLang: SupportedLanguageCode = 'en',
  ): string {
    if (!text || typeof text !== 'string') return '';
    const trimmed = text.trim();
    if (!trimmed) return text;

    // 1. English is identity
    if (targetLang === 'en' || sourceLang === targetLang) {
      return TranslationProtector.interpolate(text, params);
    }

    const cacheKey = TranslationCache.makeKey(sourceLang, targetLang, trimmed);

    // 2. Check Cache (L1 or L2)
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return TranslationProtector.interpolate(cached, params);
    }

    // 3. Check Controlled Glossary
    const glossaryMatch = lookupGlossary(trimmed, targetLang);
    if (glossaryMatch) {
      this.cache.set(cacheKey, glossaryMatch);
      return TranslationProtector.interpolate(glossaryMatch, params);
    }

    // 4. Trigger asynchronous background translation if uncached
    this.triggerBackgroundTranslation(trimmed, sourceLang, targetLang);

    // 5. Fallback immediately to source English text while background fetch completes
    return TranslationProtector.interpolate(text, params);
  }

  /**
   * Asynchronous translation returning a Promise.
   * Features full request deduplication to prevent request storms.
   */
  public async translateAsync(
    text: string,
    targetLang: SupportedLanguageCode,
    params?: InterpolationParams,
    sourceLang: SupportedLanguageCode = 'en',
  ): Promise<string> {
    if (!text || typeof text !== 'string') return '';
    const trimmed = text.trim();
    if (!trimmed) return text;

    if (targetLang === 'en' || sourceLang === targetLang) {
      return TranslationProtector.interpolate(text, params);
    }

    const cacheKey = TranslationCache.makeKey(sourceLang, targetLang, trimmed);

    // Check Cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return TranslationProtector.interpolate(cached, params);
    }

    // Check Glossary
    const glossaryMatch = lookupGlossary(trimmed, targetLang);
    if (glossaryMatch) {
      this.cache.set(cacheKey, glossaryMatch);
      return TranslationProtector.interpolate(glossaryMatch, params);
    }

    // Check In-flight deduplication
    if (this.inFlightRequests.has(cacheKey)) {
      const existingPromise = this.inFlightRequests.get(cacheKey)!;
      const result = await existingPromise;
      return TranslationProtector.interpolate(result, params);
    }

    // Execute Translation Pipeline
    const translationPromise = this.executeTranslation(trimmed, sourceLang, targetLang, cacheKey);
    this.inFlightRequests.set(cacheKey, translationPromise);

    try {
      const translated = await translationPromise;
      return TranslationProtector.interpolate(translated, params);
    } finally {
      this.inFlightRequests.delete(cacheKey);
    }
  }

  /**
   * Translates a batch of unique texts simultaneously.
   * Resolves cached/glossary hits synchronously and batches remaining uncached strings
   * to the translation engine in a single coordinated network request.
   */
  public async translateBatch(
    texts: string[],
    targetLang: SupportedLanguageCode,
    sourceLang: SupportedLanguageCode = 'en',
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    if (!texts || texts.length === 0) return results;

    if (targetLang === 'en' || sourceLang === targetLang) {
      for (const t of texts) {
        results.set(t, t);
      }
      return results;
    }

    const uncachedTexts: string[] = [];
    const uncachedMaskedData: { text: string; maskedText: string; tokens: Map<string, string> }[] = [];

    // Phase 1: Resolve all Cache and Glossary hits
    for (const text of texts) {
      if (!text || !text.trim()) {
        results.set(text, text);
        continue;
      }

      const trimmed = text.trim();
      const cacheKey = TranslationCache.makeKey(sourceLang, targetLang, trimmed);

      // Check Cache
      const cached = this.cache.get(cacheKey);
      if (cached) {
        results.set(text, cached);
        continue;
      }

      // Check Glossary
      const glossaryMatch = lookupGlossary(trimmed, targetLang);
      if (glossaryMatch) {
        this.cache.set(cacheKey, glossaryMatch);
        results.set(text, glossaryMatch);
        continue;
      }

      // Needs Dynamic Translation
      uncachedTexts.push(trimmed);
      const masked = TranslationProtector.mask(trimmed);
      uncachedMaskedData.push({
        text: trimmed,
        maskedText: masked.maskedText,
        tokens: masked.tokens,
      });
    }

    if (uncachedTexts.length === 0) {
      return results;
    }

    // Phase 2: Dynamic Translation via LibreTranslate Client
    if (this.client.isConfigured()) {
      try {
        const maskedStrings = uncachedMaskedData.map((d) => d.maskedText);
        const translatedMaskedList = await this.client.translateBatch({
          texts: maskedStrings,
          sourceLang,
          targetLang,
        });

        for (let i = 0; i < uncachedMaskedData.length; i++) {
          const item = uncachedMaskedData[i];
          const rawTranslated = translatedMaskedList[i] || item.text;
          const unmasked = TranslationProtector.unmask(rawTranslated, item.tokens);
          const finalResult = unmasked || item.text;

          const cacheKey = TranslationCache.makeKey(sourceLang, targetLang, item.text);
          if (finalResult && finalResult !== item.text) {
            this.cache.set(cacheKey, finalResult);
            this.notifyListeners(cacheKey, finalResult, targetLang);
          }

          results.set(item.text, finalResult);
        }
      } catch {
        // Hard failure boundary: fall back to original English text for all uncached strings
        for (const item of uncachedMaskedData) {
          results.set(item.text, item.text);
        }
      }
    } else {
      // Unconfigured client fallback: English source text
      for (const item of uncachedMaskedData) {
        results.set(item.text, item.text);
      }
    }

    return results;
  }

  /**
   * Schedules a background translation without awaiting.
   */
  private triggerBackgroundTranslation(
    text: string,
    sourceLang: SupportedLanguageCode,
    targetLang: SupportedLanguageCode,
  ): void {
    const cacheKey = TranslationCache.makeKey(sourceLang, targetLang, text);
    if (this.inFlightRequests.has(cacheKey) || !this.client.isConfigured()) {
      return;
    }

    const translationPromise = this.executeTranslation(text, sourceLang, targetLang, cacheKey);
    this.inFlightRequests.set(cacheKey, translationPromise);

    translationPromise
      .then((translated) => {
        if (translated && translated !== text) {
          this.notifyListeners(cacheKey, translated, targetLang);
        }
      })
      .catch(() => {
        // Silent background fallback
      })
      .finally(() => {
        this.inFlightRequests.delete(cacheKey);
      });
  }

  private async executeTranslation(
    text: string,
    sourceLang: SupportedLanguageCode,
    targetLang: SupportedLanguageCode,
    cacheKey: string,
  ): Promise<string> {
    // 1. Mask non-translatable values & identifiers
    const { maskedText, tokens } = TranslationProtector.mask(text);

    // 2. Call LibreTranslate
    const rawTranslated = await this.client.translateText({
      text: maskedText,
      sourceLang,
      targetLang,
    });

    // 3. Unmask original tokens
    const finalTranslation = TranslationProtector.unmask(rawTranslated, tokens);

    // 4. Save to Cache
    if (finalTranslation && finalTranslation.trim()) {
      this.cache.set(cacheKey, finalTranslation);
    }

    return finalTranslation || text;
  }

  /**
   * Reset all cached translations.
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

export const translationManager = TranslationManager.getInstance();
