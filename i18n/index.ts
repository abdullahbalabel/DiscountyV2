import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Translation strings
import en from './locales/en.json';
import ar from './locales/ar.json';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

const LANG_KEY = '@discounty_language';

const init = async () => {
  let savedLang: string | null = null;
  try {
    savedLang = await AsyncStorage.getItem(LANG_KEY);
  } catch { /* silent */ }

  await i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v4',
      resources,
      lng: savedLang || 'ar',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
};

init().then(() => setupRtl());

// Handle RTL/LTR — returns true if a reload is needed
export const setupRtl = (): boolean => {
  const isRTL = i18n.language?.startsWith('ar');
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    return true;
  }
  return false;
};

// Persist language to AsyncStorage
export const saveLanguage = async (lang: string) => {
  try {
    await AsyncStorage.setItem(LANG_KEY, lang);
  } catch { /* silent */ }
};

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
  const { DevSettings } = require('react-native');
  DevSettings?.reload?.();
};

export default i18n;
