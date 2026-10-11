import type { ListRecord } from '../types/models'
import { sortByPosition } from '../utils/positions'

const cache = new Map<string, ListRecord>()
const STORAGE_KEY = 'lists.records'

let hydrated = false

function persist(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...cache.values()]))
}

export function hydrateListCache(): void {
  if (hydrated) return
  hydrated = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const rows = JSON.parse(raw) as ListRecord[]
    for (const row of rows) {
      if (row?.id) cache.set(row.id, row)
    }
  } catch {
    /* ignore */
  }
}

export function peekList(id: string): ListRecord | undefined {
  hydrateListCache()
  return cache.get(id)
}

export function putList(list: ListRecord): void {
  hydrateListCache()
  cache.set(list.id, list)
  persist()
}

/** Keep the newer of cached vs remote so optimistic writes are not clobbered by slow GETs. */
export function mergeRemoteList(remote: ListRecord): ListRecord {
  hydrateListCache()
  const cached = cache.get(remote.id)
  if (cached && cached.updatedAt > remote.updatedAt) return cached
  cache.set(remote.id, remote)
  persist()
  return remote
}

export function removeList(id: string): void {
  hydrateListCache()
  cache.delete(id)
  persist()
}

export function listActiveCached(): ListRecord[] {
  hydrateListCache()
  return sortByPosition([...cache.values()].filter((list) => list.deletedAt === null))
}

export function listTrashCached(): ListRecord[] {
  hydrateListCache()
  return [...cache.values()]
    .filter((list) => list.deletedAt !== null)
    .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
}

export function clearListCache(): void {
  cache.clear()
  localStorage.removeItem(STORAGE_KEY)
  hydrated = false
}
