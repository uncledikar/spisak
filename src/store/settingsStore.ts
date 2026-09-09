import { create } from 'zustand'
import i18n, { detectLanguage, type AppLanguage, SUPPORTED_LANGUAGES } from '../i18n'
import { db } from '../db'
import type { SettingsRecord } from '../db/types'

type Theme = 'light' | 'dark'

interface SettingsState {
  theme: Theme
  language: AppLanguage
  ready: boolean
  init: () => Promise<void>
  setTheme: (theme: Theme) => Promise<void>
  toggleTheme: () => Promise<void>
  setLanguage: (language: AppLanguage) => Promise<void>
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#121512' : '#2d6a4f')
  }
}

function applyLanguage(language: AppLanguage) {
  document.documentElement.lang = language === 'sr' ? 'sr-Latn' : language
  void i18n.changeLanguage(language)
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function normalizeLanguage(value: string | null | undefined): AppLanguage {
  if (value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)) {
    return value as AppLanguage
  }
  return detectLanguage()
}

async function persist(theme: Theme, language: AppLanguage): Promise<void> {
  const row: SettingsRecord = { id: 'app', theme, language }
  await db.settings.put(row)
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'light',
  language: 'en',
  ready: false,
  init: async () => {
    let row = await db.settings.get('app')
    if (!row) {
      row = { id: 'app', theme: systemTheme(), language: detectLanguage() }
      await db.settings.put(row)
    }
    const language = normalizeLanguage(row.language)
    applyTheme(row.theme)
    applyLanguage(language)
    if (row.language !== language) {
      await persist(row.theme, language)
    }
    set({ theme: row.theme, language, ready: true })
  },
  setTheme: async (theme) => {
    applyTheme(theme)
    set({ theme })
    await persist(theme, get().language)
  },
  toggleTheme: async () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    await get().setTheme(next)
  },
  setLanguage: async (language) => {
    applyLanguage(language)
    set({ language })
    await persist(get().theme, language)
  },
}))
