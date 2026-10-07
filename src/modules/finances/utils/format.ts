/** Display YYYY-MM-DD as DD.MM.YYYY */
export function formatDisplayDate(dateKey: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (!m) return dateKey
  return `${m[3]}.${m[2]}.${m[1]}`
}

export function formatAmount(n: number): string {
  if (!Number.isFinite(n)) return '0'
  const rounded = Math.round(n * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)
}
