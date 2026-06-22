import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { type AppLanguage, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from '../i18n';

export function useLanguage() {
  const { i18n } = useTranslation();
  const current = (
    SUPPORTED_LANGUAGES.includes(i18n.language as AppLanguage) ? i18n.language : 'fr'
  ) as AppLanguage;

  const setLanguage = useCallback(
    async (lang: AppLanguage) => {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      await i18n.changeLanguage(lang);
    },
    [i18n],
  );

  return { current, setLanguage };
}
