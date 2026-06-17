import { useApp } from '../context/AppContext';
import { t, type TranslationKey } from '../i18n/translations';

export function useT() {
  const { language } = useApp();
  return (key: TranslationKey) => t(language, key);
}
