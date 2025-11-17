import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationService from './services/translationService';

// Import translation files directly
import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';
import ar from './locales/ar/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      ar: { translation: ar }
    },
    fallbackLng: 'fr',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    // تعطيل Suspense لضمان عرض الترجمات مباشرة بدون انتظار
    react: {
      useSuspense: false,
    },
    // إعدادات الترجمة التلقائية
    saveMissing: true,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.warn(`Missing translation key: ${key} for language: ${lng}`);
      // يمكن إضافة منطق لإرسال المفاتيح المفقودة للخادم
    },
  });

// Function to change language and update document direction
i18n.on('languageChanged', (lng) => {
  // تطبيع اللغة (إزالة أي suffixes مثل -US أو _FR)
  const normalizedLng = lng ? lng.split(/[-_]/)[0].toLowerCase() : 'fr';
  
  // تحديث اللغة في خدمة الترجمة
  translationService.setLanguage(normalizedLng);
  
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', normalizedLng);
    if (normalizedLng === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.body.classList.add('rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.body.classList.remove('rtl');
    }
  }
});

// Set initial direction on load (only if document is available)
// Since resources are imported directly, i18n.init() is synchronous
// So we can set the initial language immediately
if (typeof document !== 'undefined') {
  const setInitialLanguage = () => {
    // Get language from i18n (already detected by LanguageDetector) or fallback
    const initialLng = i18n.language || localStorage.getItem('i18nextLng') || 'fr';
    const normalizedLng = initialLng ? initialLng.split(/[-_]/)[0].toLowerCase() : 'fr';
    
    // Normalize and set language if needed
    if (i18n.language !== normalizedLng) {
      // Use changeLanguage to trigger languageChanged event
      i18n.changeLanguage(normalizedLng).catch(() => {
        // Fallback: set directly if changeLanguage fails
        i18n.language = normalizedLng;
        // Manually trigger languageChanged event
        i18n.emit('languageChanged', normalizedLng);
      });
    } else {
      // Language is already correct, just update document attributes
      translationService.setLanguage(normalizedLng);
      document.documentElement.setAttribute('lang', normalizedLng);
      if (normalizedLng === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
        document.body.classList.add('rtl');
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.body.classList.remove('rtl');
      }
    }
  };
  
  // Set immediately - i18n should be initialized synchronously
  setInitialLanguage();
  
  // Also set after a microtask to ensure it runs after any async operations
  Promise.resolve().then(setInitialLanguage);
}

export default i18n;
