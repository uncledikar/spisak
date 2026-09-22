import { create } from 'zustand'

interface DataState {
  /** Bumped after successful Supabase mutations so live queries refetch. */
  revision: number
  bump: () => void
}

export const useDataStore = create<DataState>((set) => ({
  revision: 0,
  bump: () => set((s) => ({ revision: s.revision + 1 })),
}))

export function bumpData(): void {
  useDataStore.getState().bump()
}
