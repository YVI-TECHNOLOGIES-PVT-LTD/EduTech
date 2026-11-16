import {
  SupportedLanguageCode,
  TranslationClientConfig,
  TranslationRequest,
  BatchTranslationRequest,
} from './translation.types';

/**
 * LibreTranslateClient
 *
 * Production-ready HTTP adapter for dynamic multi-language translation.
 *
 * Tier 1: Uses private self-hosted LibreTranslate instance if VITE_TRANSLATION_API_URL is configured.
 * Tier 2: Uses standard zero-config client-side free translation endpoint when self-hosted URL is not configured.
 * Tier 3: Hard failure boundary — gracefully falls back to source English text without blocking the UI.
 */
export class LibreTranslateClient {
  private apiUrl: string;
  private apiKey?: string;
  private timeoutMs: number;

  constructor(config?: TranslationClientConfig) {
    // 1. Resolve translation API URL from config or environment variable
    const envUrl =
      typeof import.meta !== 'undefined' && import.meta.env
        ? (import.meta.env.VITE_TRANSLATION_API_URL as string | undefined)
        : undefined;

    const windowEnvUrl =
      typeof window !== 'undefined'
        ? ((window as any).__ENV__?.VITE_TRANSLATION_API_URL as string | undefined)
        : undefined;

    this.apiUrl = (config?.apiUrl || envUrl || windowEnvUrl || '').replace(/\/+$/, '');
    this.apiKey =
      config?.apiKey ||
      (typeof import.meta !== 'undefined' && import.meta.env
        ? (import.meta.env.VITE_TRANSLATION_API_KEY as string | undefined)
        : undefined);
    this.timeoutMs = config?.timeoutMs || 5000;
  }

  /**
   * Checks if a custom private translation endpoint is configured.
   */
  public isCustomEndpointConfigured(): boolean {
    return Boolean(this.apiUrl && this.apiUrl.trim().length > 0);
  }

  /**
   * The client is always operational (either via self-hosted server or free fallback).
   */
  public isConfigured(): boolean {
    return true;
  }

  /**
   * Translates a single text string.
   */
  public async translateText(req: TranslationRequest): Promise<string> {
    const { text, sourceLang = 'en', targetLang, format = 'text' } = req;

    if (!text || !text.trim() || sourceLang === targetLang) {
      return text;
    }

    // Tier 1: Self-hosted LibreTranslate instance if configured
    if (this.isCustomEndpointConfigured()) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const endpoint = `${this.apiUrl}/translate`;
        const payload: Record<string, any> = {
          q: text,
          source: sourceLang,
          target: targetLang,
          format,
        };

        if (this.apiKey) {
          payload.api_key = this.apiKey;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data && typeof data.translatedText === 'string') {
            return data.translatedText;
          }
        }
      } catch {
        // Fall through to free fallback tier
      }
    }

    // Tier 2: Free Public Client-Side Translation Engine (Zero-Config)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translated = data[0]
            .map((item: any) => (item && item[0] ? item[0] : ''))
            .filter(Boolean)
            .join('');
          if (translated && translated.trim()) {
            return translated;
          }
        }
      }
    } catch {
      // Fall through to Tier 3
    }

    // Tier 3: Hard failure boundary (English source text)
    return text;
  }

  /**
   * Translates an array of text strings in batch.
   */
  public async translateBatch(req: BatchTranslationRequest): Promise<string[]> {
    const { texts, sourceLang = 'en', targetLang, format = 'text' } = req;

    if (!texts || texts.length === 0) return [];
    if (sourceLang === targetLang) {
      return texts;
    }

    // Tier 1: Self-hosted LibreTranslate batch if configured
    if (this.isCustomEndpointConfigured()) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        const endpoint = `${this.apiUrl}/translate`;
        const payload: Record<string, any> = {
          q: texts,
          source: sourceLang,
          target: targetLang,
          format,
        };

        if (this.apiKey) {
          payload.api_key = this.apiKey;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.translatedText)) {
            return data.translatedText;
          }
        }
      } catch {
        // Fall through to concurrent free batch translation
      }
    }

    // Tier 2: Concurrent Translation using free engine with concurrency limit
    const results: string[] = new Array(texts.length);
    const BATCH_CONCURRENCY = 8;

    for (let i = 0; i < texts.length; i += BATCH_CONCURRENCY) {
      const chunk = texts.slice(i, i + BATCH_CONCURRENCY);
      const promises = chunk.map((text, idx) =>
        this.translateText({ text, sourceLang, targetLang }).then((res) => {
          results[i + idx] = res;
        })
      );
      await Promise.allSettled(promises);
    }

    // Fill any unresolved items with original English text
    for (let i = 0; i < texts.length; i++) {
      if (!results[i]) {
        results[i] = texts[i];
      }
    }

    return results;
  }
}
