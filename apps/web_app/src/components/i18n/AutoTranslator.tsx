import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { domTranslationRuntime } from '@/services/translation';

/**
 * AutoTranslator
 *
 * Headless React bridge mounted at the application root.
 * Synchronizes language state, route navigation, and dynamic UI renders with the DomTranslationRuntime.
 */
export const AutoTranslator: React.FC = () => {
  const { language } = useLanguage();
  const location = useLocation();

  // Initialize runtime on mount and sync language changes
  useEffect(() => {
    domTranslationRuntime.start(language);
    domTranslationRuntime.setLanguage(language);
    domTranslationRuntime.sweepDocument();
  }, [language]);

  // Trigger comprehensive sweep on route navigation
  useEffect(() => {
    // Immediate sweep
    domTranslationRuntime.sweepDocument();

    // Secondary sweep to catch async API data and lazy component renders
    const timer = setTimeout(() => {
      domTranslationRuntime.sweepDocument();
    }, 150);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  // Periodic lightweight sweep for dynamic popovers, tooltips, and tab changes
  useEffect(() => {
    if (language === 'en') return;

    const interval = setInterval(() => {
      domTranslationRuntime.sweepDocument();
    }, 1200);

    return () => clearInterval(interval);
  }, [language]);

  return null;
};
