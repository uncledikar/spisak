import { create } from 'zustand'
import i18n, { detectLanguage, type AppLanguage, SUPPORTED_LANGUAGES } from '../i18n'
import { getSettings, upsertSettings } from '../api/settings'
import { supabase } from '../lib/supabase'

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

/** Mirror of last applied settings (faster boot + offline). */
const CACHE_KEY = 'spisak.settings'
/**
 * Explicit pre-login choice. Kept in localStorage (not sessionStorage) so it
 * survives Google OAuth full-page redirects, then upserted into Supabase.
 */
const PENDING_KEY = 'spisak.pendingSettings'
/** Legacy flag from older fix — ignore/clear. */
const LEGACY_OVERRIDE_KEY = 'spisak.settings.override'

type Prefs = {
  theme: Theme
  language: AppLanguage
}

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

function isLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

function readCache(): Partial<Prefs> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    const row = JSON.parse(raw) as Record<string, unknown>
    return {
      theme: isTheme(row.theme) ? row.theme : undefined,
      language: isLanguage(row.language) ? row.language : undefined,
    }
  } catch {
    return {}
  }
}

function writeCache(prefs: Prefs): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(prefs))
}

/** In-memory copy so StrictMode double-init cannot drop pending before DB upsert. */
let memoryPending: Partial<Prefs> | null = null

function readPending(): Partial<Prefs> | null {
  if (memoryPending) return memoryPending
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const row = JSON.parse(raw) as Record<string, unknown>
    const prefs: Partial<Prefs> = {}
    if (isTheme(row.theme)) prefs.theme = row.theme
    if (isLanguage(row.language)) prefs.language = row.language
    if (prefs.theme || prefs.language) {
      memoryPending = prefs
      return prefs
    }
    return null
  } catch {
    return null
  }
}

function writePending(prefs: Prefs): void {
  memoryPending = prefs
  localStorage.setItem(PENDING_KEY, JSON.stringify(prefs))
  writeCache(prefs)
}

function clearPending(): void {
  memoryPending = null
  localStorage.removeItem(PENDING_KEY)
  localStorage.removeItem(LEGACY_OVERRIDE_KEY)
  try {
    sessionStorage.removeItem(PENDING_KEY)
  } catch {
    /* ignore */
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#121512' : '#2d6a4f')
  }
}

async function applyLanguage(language: AppLanguage) {
  document.documentElement.lang = language === 'sr' ? 'sr-Latn' : language
  await i18n.changeLanguage(language)
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

async function isSignedIn(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return !!session
}

async function saveToDb(prefs: Prefs): Promise<void> {
  await upsertSettings({ theme: prefs.theme, language: prefs.language })
}

/** Boot UI language/theme before React (pending → cache → system). */
export function bootstrapLocalSettings(): Prefs {
  localStorage.removeItem(LEGACY_OVERRIDE_KEY)
  const pending = readPending()
  const cache = readCache()
  const prefs: Prefs = {
    theme: pending?.theme ?? cache.theme ?? systemTheme(),
    language: pending?.language ?? cache.language ?? detectLanguage(),
  }
  applyTheme(prefs.theme)
  void applyLanguage(prefs.language)
  writeCache(prefs)
  return prefs
}

const boot = bootstrapLocalSettings()

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: boot.theme,
  language: boot.language,
  ready: false,

  init: async () => {
    set({ ready: false })
    const pending = readPending()

    try {
      const remote = await getSettings()
      let prefs: Prefs

      if (pending?.language || pending?.theme) {
        // Pre-login choice (AuthGate) wins and is saved to DB.
        prefs = {
          theme: pending.theme ?? remote?.theme ?? get().theme,
          language: pending.language ?? (isLanguage(remote?.language) ? remote.language : get().language),
        }
        await saveToDb(prefs)
        clearPending()
      } else if (remote) {
        prefs = {
          theme: remote.theme,
          language: isLanguage(remote.language) ? remote.language : get().language,
        }
        if (!isLanguage(remote.language)) {
          await saveToDb(prefs)
        }
      } else {
        prefs = { theme: get().theme, language: get().language }
        await saveToDb(prefs)
      }

      applyTheme(prefs.theme)
      await applyLanguage(prefs.language)
      writeCache(prefs)
      set({ ...prefs, ready: true })
    } catch (error) {
      console.error('Settings init failed', error)
      // Keep pending so a retry after login can still push AuthGate language to DB.
      const prefs: Prefs = {
        theme: pending?.theme ?? get().theme,
        language: pending?.language ?? get().language,
      }
      applyTheme(prefs.theme)
      await applyLanguage(prefs.language)
      writeCache(prefs)
      set({ ...prefs, ready: true })
    }
  },

  setTheme: async (theme) => {
    applyTheme(theme)
    const prefs: Prefs = { theme, language: get().language }
    set({ theme })
    if (await isSignedIn()) {
      clearPending()
      writeCache(prefs)
      await saveToDb(prefs)
      return
    }
    writePending(prefs)
  },

  toggleTheme: async () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    await get().setTheme(next)
  },

  setLanguage: async (language) => {
    await applyLanguage(language)
    const prefs: Prefs = { theme: get().theme, language }
    set({ language })
    if (await isSignedIn()) {
      clearPending()
      writeCache(prefs)
      await saveToDb(prefs)
      return
    }
    writePending(prefs)
  },
}))
