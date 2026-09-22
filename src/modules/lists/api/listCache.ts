import type { ListRecord } from '../types/models'

const cache = new Map<string, ListRecord>()

export function peekList(id: string): ListRecord | undefined {
  return cache.get(id)
}

export function putList(list: ListRecord): void {
  cache.set(list.id, list)
}

/** Keep the newer of cached vs remote so optimistic writes are not clobbered by slow GETs. */
export function mergeRemoteList(remote: ListRecord): ListRecord {
  const cached = cache.get(remote.id)
  if (cached && cached.updatedAt > remote.updatedAt) return cached
  cache.set(remote.id, remote)
  return remote
}

export function removeList(id: string): void {
  cache.delete(id)
}

export function clearListCache(): void {
  cache.clear()
}
