import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';

export const LANGUAGE_STORAGE_KEY = 'app_language';
export const SUPPORTED_LANGUAGES = ['fr', 'en'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const systemLocale = getLocales()[0]?.languageCode ?? 'fr';
const defaultLng: AppLanguage = SUPPORTED_LANGUAGES.includes(systemLocale as AppLanguage)
  ? (systemLocale as AppLanguage)
  : 'fr';

i18n.use(initReactI18next).init({
  fallbackLng: 'fr',
  lng: defaultLng,
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  interpolation: { escapeValue: false },
});

export async function loadSavedLanguage(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved as AppLanguage)) {
      await i18n.changeLanguage(saved);
    }
  } catch {
    // fall back silently to system locale
  }
}

export default i18n;
