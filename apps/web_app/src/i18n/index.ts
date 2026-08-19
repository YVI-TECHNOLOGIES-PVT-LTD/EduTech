import { applyDocumentLanguage, getInitialLanguage } from './direction';
import { translationManager } from '@/services/translation';

// Initialize document language and enforce strict LTR on startup
const initialLang = getInitialLanguage();
applyDocumentLanguage(initialLang);

export * from './config/languages';
export * from './direction';
export { translationManager };
export default translationManager;
