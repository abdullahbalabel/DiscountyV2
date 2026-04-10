import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { DevSettings, I18nManager } from 'react-native';
import * as Updates from 'expo-updates';

// Translation strings
import en from './locales/en.json';
import ar from './locales/ar.json';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

const defaultLocale = 'ar';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources,
    lng: defaultLocale,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

// Handle RTL — returns true if a reload is needed
export const setupRtl = (): boolean => {
  const isRTL = i18n.language?.startsWith('ar');
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    return true; // layout direction changed, reload required
  }
  return false;
};

// Call on startup
setupRtl();

// Reload the app to apply RTL changes natively
export const reloadForRtl = async () => {
  try {
    if (Updates?.isEnabled) {
      await Updates.reloadAsync();
      return;
    }
  } catch {
    // Updates.reloadAsync failed, fall through to DevSettings
  }
  // Fallback for Expo Go / dev mode
  DevSettings?.reload?.();
};

export default i18n;
