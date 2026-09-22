import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { enUS, es, fr, ru, srLatn } from 'date-fns/locale'
import type { Locale } from 'date-fns'

const locales: Record<string, Locale> = {
  en: enUS,
  es,
  fr,
  ru,
  sr: srLatn,
}

const deadlineFormats: Record<string, string> = {
  en: 'MMMM d, yyyy',
  es: "d 'de' MMMM 'de' yyyy",
  fr: 'd MMMM yyyy',
  ru: "d MMMM yyyy 'г.'",
  sr: 'd. MMMM yyyy.',
}

export function formatRelative(ts: number, lang: string): string {
  const locale = locales[lang] ?? enUS
  return formatDistanceToNow(ts, { addSuffix: true, locale })
}

/** Format stored ISO date (yyyy-MM-dd) for display, e.g. "6 сентября 2026 г." */
export function formatDeadline(isoDate: string, lang: string): string {
  const date = parseISO(isoDate)
  if (Number.isNaN(date.getTime())) return isoDate
  const locale = locales[lang] ?? enUS
  const pattern = deadlineFormats[lang] ?? deadlineFormats.en
  return format(date, pattern, { locale })
}
