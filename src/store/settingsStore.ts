import { create } from 'zustand'
import i18n, { detectLanguage, type AppLanguage, SUPPORTED_LANGUAGES } from '../i18n'
import { getSettings, upsertSettings } from '../api/settings'

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

const LOCAL_SETTINGS_KEY = 'spisak.settings'
/** Set when user explicitly picks theme/language (e.g. on AuthGate) — wins over stale cloud prefs once. */
const LOCAL_OVERRIDE_KEY = 'spisak.settings.override'

type LocalSettings = {
  theme?: Theme
  language?: AppLanguage
}

function readLocalSettings(): LocalSettings {
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as LocalSettings
    return {
      theme: parsed.theme === 'dark' || parsed.theme === 'light' ? parsed.theme : undefined,
      language:
        parsed.language && (SUPPORTED_LANGUAGES as readonly string[]).includes(parsed.language)
          ? parsed.language
          : undefined,
    }
  } catch {
    return {}
  }
}

function writeLocalSettings(theme: Theme, language: AppLanguage): void {
  localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify({ theme, language }))
}

function markLocalOverride(): void {
  localStorage.setItem(LOCAL_OVERRIDE_KEY, '1')
}

function consumeLocalOverride(): boolean {
  const active = localStorage.getItem(LOCAL_OVERRIDE_KEY) === '1'
  if (active) localStorage.removeItem(LOCAL_OVERRIDE_KEY)
  return active
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

function normalizeLanguage(value: string | null | undefined): AppLanguage | null {
  if (value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)) {
    return value as AppLanguage
  }
  return null
}

async function persistRemote(theme: Theme, language: AppLanguage): Promise<void> {
  try {
    await upsertSettings({ theme, language })
  } catch (error) {
    // Before sign-in (or offline), localStorage is enough.
    console.warn('Settings not saved remotely', error)
  }
}

/** User-driven change: keep locally and flag so it beats cloud after OAuth. */
function persistUserChoice(theme: Theme, language: AppLanguage): void {
  writeLocalSettings(theme, language)
  markLocalOverride()
  void persistRemote(theme, language)
}

/** Bootstrap language/theme before React mounts (survives OAuth redirect). */
export function bootstrapLocalSettings(): { theme: Theme; language: AppLanguage } {
  const local = readLocalSettings()
  const theme = local.theme ?? systemTheme()
  const language = local.language ?? detectLanguage()
  applyTheme(theme)
  applyLanguage(language)
  return { theme, language }
}

const boot = bootstrapLocalSettings()

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: boot.theme,
  language: boot.language,
  ready: false,
  init: async () => {
    set({ ready: false })
    const local = readLocalSettings()
    const inMemory = get()
    const preferLocal = consumeLocalOverride()
    try {
      const remote = await getSettings()

      let theme: Theme
      let language: AppLanguage

      if (preferLocal) {
        // Explicit AuthGate / pre-login choice wins over stale Supabase row (e.g. old "ru").
        theme = local.theme ?? inMemory.theme ?? remote?.theme ?? systemTheme()
        language =
          local.language ??
          normalizeLanguage(inMemory.language) ??
          normalizeLanguage(remote?.language) ??
          detectLanguage()
      } else {
        theme = remote?.theme ?? local.theme ?? inMemory.theme ?? systemTheme()
        language =
          normalizeLanguage(remote?.language) ??
          local.language ??
          normalizeLanguage(inMemory.language) ??
          detectLanguage()
      }

      applyTheme(theme)
      applyLanguage(language)
      writeLocalSettings(theme, language)
      if (!remote || remote.theme !== theme || remote.language !== language) {
        await persistRemote(theme, language)
      }
      set({ theme, language, ready: true })
    } catch (error) {
      console.error('Settings init failed', error)
      const theme = local.theme ?? inMemory.theme ?? systemTheme()
      const language = local.language ?? inMemory.language ?? detectLanguage()
      applyTheme(theme)
      applyLanguage(language)
      writeLocalSettings(theme, language)
      set({ theme, language, ready: true })
    }
  },
  setTheme: async (theme) => {
    applyTheme(theme)
    set({ theme })
    persistUserChoice(theme, get().language)
  },
  toggleTheme: async () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    await get().setTheme(next)
  },
  setLanguage: async (language) => {
    applyLanguage(language)
    set({ language })
    persistUserChoice(get().theme, language)
  },
}))
