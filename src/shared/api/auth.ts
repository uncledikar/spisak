import { supabase } from '../lib/supabase'

/** Prefer local session so offline writes still work. */
export async function requireUserId(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.user?.id) return session.user.id

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error('Not authenticated')
  return user.id
}

export function toEpochMs(value: string | null | undefined): number | null {
  if (!value) return null
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

export function toIso(ms: number): string {
  return new Date(ms).toISOString()
}
