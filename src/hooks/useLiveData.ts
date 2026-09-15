import { useEffect, useState } from 'react'
import { useDataStore } from '../store/dataStore'

/**
 * Drop-in replacement for Dexie `useLiveQuery`:
 * runs an async loader and re-runs when deps or data revision change.
 * Returns `undefined` until the first result arrives.
 */
export function useLiveData<T>(loader: () => Promise<T>, deps: unknown[]): T | undefined {
  const revision = useDataStore((s) => s.revision)
  const [data, setData] = useState<T | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    void loader()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((error) => {
        console.error('useLiveData failed', error)
      })
    return () => {
      cancelled = true
    }
    // oxlint-disable-next-line react/exhaustive-deps -- caller-provided deps
  }, [revision, ...deps])

  return data
}
