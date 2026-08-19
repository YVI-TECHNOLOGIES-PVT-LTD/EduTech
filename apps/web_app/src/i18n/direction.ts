import { getLanguageConfig, DEFAULT_LANGUAGE } from './config/languages';

const STORAGE_KEY = 'erp-language';

/**
 * Synchronizes document language attribute and strictly enforces standard LTR shell layout.
 * Direction across the application container is ALWAYS 'ltr'.
 */
export function applyDocumentLanguage(langCode: string): 'ltr' {
  if (typeof document === 'undefined') return 'ltr';

  const config = getLanguageConfig(langCode);
  document.documentElement.lang = config.code;
  // Strictly enforce LTR across the application shell
  document.documentElement.dir = 'ltr';
  document.documentElement.classList.remove('rtl');
  document.documentElement.classList.add('ltr');

  return 'ltr';
}

export const applyDocumentDirection = applyDocumentLanguage;

/**
 * Get initial language from localStorage or fallback default.
 */
export function getInitialLanguage(): string {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && getLanguageConfig(saved)) {
      return saved;
    }
  } catch {
    // localStorage unavailable
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Format a number using the active locale.
 */
export function formatLocaleNumber(
  value: number,
  locale: string = 'en-IN',
  options?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return value.toLocaleString();
  }
}

/**
 * Format currency using the active locale.
 */
export function formatLocaleCurrency(
  amount: number,
  locale: string = 'en-IN',
  currency: string = 'INR',
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString()}`;
  }
}

/**
 * Format date using the active locale.
 */
export function formatLocaleDate(
  date: Date | string | number,
  locale: string = 'en-IN',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
): string {
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(locale, options).format(d);
  } catch {
    return String(date);
  }
}
