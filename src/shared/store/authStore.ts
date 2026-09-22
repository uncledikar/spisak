import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { clearListCache } from '../../modules/lists/api/listCache'
import { clearEntityCache as clearMedicineCache } from '../../modules/medicine/api/entityCache'
import { clearSyncQueue as clearMedicineQueue } from '../../modules/medicine/api/syncQueue'
import { clearEntityCache as clearFinancesCache } from '../../modules/finances/api/entityCache'
import { clearSyncQueue as clearFinancesQueue } from '../../modules/finances/api/syncQueue'
import { authRedirectTo, supabase } from '../lib/supabase'
import { bumpData } from './dataStore'

function clearAllModuleCaches() {
  clearListCache()
  clearMedicineCache()
  clearMedicineQueue()
  clearFinancesCache()
  clearFinancesQueue()
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
    set({ session, user: session?.user ?? null, ready: true })

    supabase.auth.onAuthStateChange((_event, next) => {
      if (!next) {
        clearAllModuleCaches()
        bumpData()
      }
      set({ session: next, user: next?.user ?? null })
    })
  },

  signInWithGoogle: async () => {
    set({ busy: true, error: null })
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: authRedirectTo(),
      },
    })
    if (error) {
      set({ busy: false, error: error.message })
    }
    // On success the browser leaves for Google.
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
