import type { SettingsRecord } from '../types/models'
import { requireUserId } from './auth'
import { supabase } from '../lib/supabase'

type SettingsRow = {
  user_id: string
  theme: 'light' | 'dark'
  language: string | null
  updated_at: string
}

export async function getSettings(): Promise<SettingsRecord | null> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('settings')
    .select('theme, language')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  const row = data as Pick<SettingsRow, 'theme' | 'language'>
  return {
    theme: row.theme === 'dark' ? 'dark' : 'light',
    language: row.language,
  }
}

export async function upsertSettings(settings: SettingsRecord): Promise<void> {
  const userId = await requireUserId()
  const { error } = await supabase.from('settings').upsert(
    {
      user_id: userId,
      theme: settings.theme,
      language: settings.language,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error
}
