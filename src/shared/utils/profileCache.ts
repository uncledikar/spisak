import type { User } from '@supabase/supabase-js'

const KEY = 'spisak.profileCache'

export type CachedProfile = {
  userId: string
  email: string
  name: string
  avatarUrl: string
}

function readRaw(): CachedProfile | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const row = JSON.parse(raw) as Partial<CachedProfile>
    if (!row.userId) return null
    return {
      userId: row.userId,
      email: typeof row.email === 'string' ? row.email : '',
      name: typeof row.name === 'string' ? row.name : '',
      avatarUrl: typeof row.avatarUrl === 'string' ? row.avatarUrl : '',
    }
  } catch {
    return null
  }
}

export function readCachedProfile(userId?: string): CachedProfile | null {
  const cached = readRaw()
  if (!cached) return null
  if (userId && cached.userId !== userId) return null
  return cached
}

export function writeCachedProfile(profile: CachedProfile): void {
  localStorage.setItem(KEY, JSON.stringify(profile))
}

export function clearCachedProfile(): void {
  localStorage.removeItem(KEY)
}

export function profileFromUser(user: User): CachedProfile {
  const meta = user.user_metadata as
    | { full_name?: string; name?: string; avatar_url?: string; picture?: string }
    | undefined
  const name = (meta?.full_name ?? meta?.name ?? '').trim()
  const avatarUrl = (meta?.avatar_url ?? meta?.picture ?? '').trim()
  const previous = readCachedProfile(user.id)
  return {
    userId: user.id,
    email: user.email ?? previous?.email ?? '',
    name: name || previous?.name || '',
    avatarUrl: avatarUrl || previous?.avatarUrl || '',
  }
}

/** Persist profile fields and warm the SW image cache while online. */
export function rememberUserProfile(user: User | null | undefined): void {
  if (!user) return
  const profile = profileFromUser(user)
  writeCachedProfile(profile)
  if (profile.avatarUrl && navigator.onLine && 'caches' in window) {
    void caches.open('spisak-avatars').then(async (cache) => {
      try {
        const hit = await cache.match(profile.avatarUrl)
        if (hit) return
        const response = await fetch(profile.avatarUrl, { mode: 'no-cors', credentials: 'omit' })
        await cache.put(profile.avatarUrl, response)
      } catch {
        /* ignore — SW may still cache on first successful img load */
      }
    })
  }
}
