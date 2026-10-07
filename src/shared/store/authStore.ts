import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { clearListCache } from '../../modules/lists/api/listCache'
import { clearSyncQueue as clearListsQueue } from '../../modules/lists/api/syncQueue'
import { clearEntityCache as clearMedicineCache } from '../../modules/medicine/api/entityCache'
import { clearSyncQueue as clearMedicineQueue } from '../../modules/medicine/api/syncQueue'
import { clearEntityCache as clearFinancesCache } from '../../modules/finances/api/entityCache'
import { clearSyncQueue as clearFinancesQueue } from '../../modules/finances/api/syncQueue'
import { authRedirectTo, supabase } from '../lib/supabase'
import { clearCachedProfile, rememberUserProfile } from '../utils/profileCache'
import { bumpData } from './dataStore'

function clearAllModuleCaches() {
  clearListCache()
  clearListsQueue()
  clearMedicineCache()
  clearMedicineQueue()
  clearFinancesCache()
  clearFinancesQueue()
  clearCachedProfile()
}

interface AuthState {
  session: Session | null
  user: User | null
  ready: boolean
  busy: boolean
  error: string | null
  init: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  ready: false,
  busy: false,
  error: null,

  init: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.user) rememberUserProfile(session.user)
    set({ session, user: session?.user ?? null, ready: true })

    supabase.auth.onAuthStateChange((_event, next) => {
      if (!next) {
        clearAllModuleCaches()
        bumpData()
      } else if (next.user) {
        rememberUserProfile(next.user)
      }
      set({ session: next, user: next?.user ?? null })
    })
  },

  signInWithGoogle: async () => {
    set({ busy: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: authRedirectTo(),
          skipBrowserRedirect: true,
        },
      })
      if (error) {
        set({ busy: false, error: error.message })
        return
      }
      if (data.url) {
        window.location.assign(data.url)
        return
      }
      set({ busy: false, error: 'Google sign-in did not return a redirect URL' })
    } catch (err) {
      set({
        busy: false,
        error: err instanceof Error ? err.message : 'Google sign-in failed',
      })
    }
  },

  signOut: async () => {
    set({ busy: true, error: null })
    const { error } = await supabase.auth.signOut()
    if (error) {
      set({ busy: false, error: error.message })
      return
    }
    clearAllModuleCaches()
    bumpData()
    set({ session: null, user: null, busy: false, error: null })
  },

  clearError: () => set({ error: null }),
}))
