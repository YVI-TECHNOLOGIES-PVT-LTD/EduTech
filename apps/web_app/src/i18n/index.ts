import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from './locales/en/translation.json';
import translationTE from './locales/te/translation.json';

const resources = {
    en: {
        translation: translationEN,
    },
    te: {
        translation: translationTE,
    },
};

i18n.use(initReactI18next).init({
    resources,
    lng: localStorage.getItem('erp-language') || 'en',
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
