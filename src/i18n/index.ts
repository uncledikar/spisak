import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import ru from './locales/ru.json'
import sr from './locales/sr.json'

export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'ru', 'sr'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export function detectLanguage(): AppLanguage {
  const raw = navigator.language || 'en'
  const base = raw.toLowerCase().split('-')[0]
  if (base === 'es') return 'es'
  if (base === 'fr') return 'fr'
  if (base === 'ru') return 'ru'
  if (base === 'sr' || base === 'sh' || base === 'bs' || base === 'hr') return 'sr'
  return 'en'
}

function languageFromStorage(): AppLanguage | null {
  for (const key of ['spisak.pendingSettings', 'spisak.settings']) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const language = (JSON.parse(raw) as { language?: unknown }).language
      if (typeof language === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(language)) {
        return language as AppLanguage
      }
    } catch {
      /* ignore */
    }
  }
  return null
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    fr: { translation: fr },
    ru: { translation: ru },
    sr: { translation: sr },
  },
  lng: languageFromStorage() ?? detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
