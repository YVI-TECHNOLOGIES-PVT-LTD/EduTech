import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  LanguageDefinition,
  SupportedLanguageCode,
  InterpolationParams,
} from '@/services/translation/translation.types';
import {
  getLanguageConfig,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
} from '@/i18n/config/languages';
import {
  applyDocumentLanguage,
  getInitialLanguage,
  formatLocaleNumber,
  formatLocaleCurrency,
  formatLocaleDate,
} from '@/i18n/direction';
import { translationManager } from '@/services/translation/TranslationManager';

const STORAGE_KEY = 'erp-language';

export interface LanguageContextValue {
  language: SupportedLanguageCode;
  languageConfig: LanguageDefinition;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  isRtlText: boolean;
  setLanguage: (lang: string) => Promise<void>;
  t: (
    keyOrText: string,
    defaultTextOrParams?: string | InterpolationParams,
    params?: InterpolationParams,
  ) => string;
  tAsync: (
    keyOrText: string,
    defaultTextOrParams?: string | InterpolationParams,
    params?: InterpolationParams,
  ) => Promise<string>;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  // Layout compatibility helpers (application shell is always LTR)
  direction: 'ltr';
  isRTL: false;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLang] = useState<SupportedLanguageCode>(() => {
    const initial = getInitialLanguage();
    const config = getLanguageConfig(initial);
    return config.code;
  });

  // Re-render tick triggered when dynamic background translations resolve
  const [, setTranslationVersion] = useState(0);

  const languageConfig = useMemo(() => getLanguageConfig(currentLang), [currentLang]);

  // Synchronize <html lang="..."> and strictly preserve dir="ltr"
  useEffect(() => {
    applyDocumentLanguage(currentLang);
  }, [currentLang]);

  // Subscribe to background translation resolutions
  useEffect(() => {
    const unsubscribe = translationManager.subscribe((_key, _translatedText, targetLang) => {
      if (targetLang === currentLang) {
        // Trigger smooth re-render for resolved text
        setTranslationVersion((v) => v + 1);
      }
    });
    return unsubscribe;
  }, [currentLang]);

  const setLanguage = useCallback(async (newLang: string) => {
    const config = getLanguageConfig(newLang);
    setCurrentLang(config.code);
    applyDocumentLanguage(config.code);
    try {
      localStorage.setItem(STORAGE_KEY, config.code);
    } catch {
      // Ignore storage errors
    }
  }, []);

  /**
   * Synchronous translation function supporting key fallback and parameter interpolation.
   */
  const t = useCallback(
    (
      keyOrText: string,
      defaultTextOrParams?: string | InterpolationParams,
      params?: InterpolationParams,
    ): string => {
      let targetText = keyOrText;
      let interpolationParams: InterpolationParams | undefined;

      if (typeof defaultTextOrParams === 'string') {
        // Form: t('common.dashboard', 'Dashboard') -> targetText is 'Dashboard'
        targetText = defaultTextOrParams;
        interpolationParams = params;
      } else if (typeof defaultTextOrParams === 'object' && defaultTextOrParams !== null) {
        // Form: t('Welcome {{name}}', { name: 'Rajesh' })
        interpolationParams = defaultTextOrParams;
      }

      // If the key is dot-separated and no default text provided, use the last segment as readable text
      if (targetText === keyOrText && targetText.includes('.') && !targetText.includes(' ')) {
        const parts = targetText.split('.');
        const lastPart = parts[parts.length - 1];
        // Convert camelCase to Space Separated
        targetText = lastPart.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
      }

      return translationManager.translateSync(
        targetText,
        currentLang,
        interpolationParams,
        'en',
      );
    },
    [currentLang],
  );

  /**
   * Asynchronous translation function returning a Promise.
   */
  const tAsync = useCallback(
    async (
      keyOrText: string,
      defaultTextOrParams?: string | InterpolationParams,
      params?: InterpolationParams,
    ): Promise<string> => {
      let targetText = keyOrText;
      let interpolationParams: InterpolationParams | undefined;

      if (typeof defaultTextOrParams === 'string') {
        targetText = defaultTextOrParams;
        interpolationParams = params;
      } else if (typeof defaultTextOrParams === 'object' && defaultTextOrParams !== null) {
        interpolationParams = defaultTextOrParams;
      }

      if (targetText === keyOrText && targetText.includes('.') && !targetText.includes(' ')) {
        const parts = targetText.split('.');
        const lastPart = parts[parts.length - 1];
        targetText = lastPart.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
      }

      return translationManager.translateAsync(
        targetText,
        currentLang,
        interpolationParams,
        'en',
      );
    },
    [currentLang],
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return formatLocaleNumber(value, languageConfig.locale, options);
    },
    [languageConfig.locale],
  );

  const formatCurrency = useCallback(
    (amount: number, currency: string = 'INR') => {
      return formatLocaleCurrency(amount, languageConfig.locale, currency);
    },
    [languageConfig.locale],
  );

  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
      return formatLocaleDate(date, languageConfig.locale, options);
    },
    [languageConfig.locale],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language: currentLang,
      languageConfig,
      supportedLanguages: SUPPORTED_LANGUAGES,
      isRtlText: languageConfig.isRtlText,
      setLanguage,
      t,
      tAsync,
      formatNumber,
      formatCurrency,
      formatDate,
      direction: 'ltr',
      isRTL: false,
    }),
    [currentLang, languageConfig, setLanguage, t, tAsync, formatNumber, formatCurrency, formatDate],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    const initial = getInitialLanguage();
    const config = getLanguageConfig(initial);
    return {
      language: config.code,
      languageConfig: config,
      supportedLanguages: SUPPORTED_LANGUAGES,
      isRtlText: config.isRtlText,
      setLanguage: async () => {},
      t: (keyOrText, defaultOrParams, params) => {
        let text = typeof defaultOrParams === 'string' ? defaultOrParams : keyOrText;
        const p = typeof defaultOrParams === 'object' ? defaultOrParams : params;
        return translationManager.translateSync(text, config.code, p);
      },
      tAsync: async (keyOrText, defaultOrParams, params) => {
        let text = typeof defaultOrParams === 'string' ? defaultOrParams : keyOrText;
        const p = typeof defaultOrParams === 'object' ? defaultOrParams : params;
        return translationManager.translateAsync(text, config.code, p);
      },
      formatNumber: (v) => v.toLocaleString(),
      formatCurrency: (a) => `₹${a.toLocaleString()}`,
      formatDate: (d) => String(d),
      direction: 'ltr',
      isRTL: false,
    };
  }
  return context;
};

// Aliases for compatibility
export const useDirection = useLanguage;
export const DirectionProvider = LanguageProvider;

export default LanguageContext;
