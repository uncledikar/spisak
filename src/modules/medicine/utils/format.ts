import type { TFunction } from 'i18next'

/** Display YYYY-MM-DD as DD.MM.YYYY */
export function formatDisplayDate(dateKey: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (!m) return dateKey
  return `${m[3]}.${m[2]}.${m[1]}`
}

const UNIT_KEYS: Record<string, string> = {
  pcs: 'medicine.units.pcs',
  шт: 'medicine.units.pcs',
  sht: 'medicine.units.pcs',
  kom: 'medicine.units.pcs',
  piece: 'medicine.units.pcs',
  pieces: 'medicine.units.pcs',
  mg: 'medicine.units.mg',
  мл: 'medicine.units.ml',
  ml: 'medicine.units.ml',
}

export function formatUnitLabel(unit: string, t: TFunction): string {
  const key = unit.trim().toLowerCase()
  const i18nKey = UNIT_KEYS[key]
  return i18nKey ? t(i18nKey) : unit
}

export function formatQty(n: number): string {
  if (!Number.isFinite(n)) return '0'
  const rounded = Math.round(n * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

/** e.g. "2 шт / день" */
export function formatPerDay(total: number, days: number, unit: string, t: TFunction): string {
  const perDay = total / Math.max(1, days)
  return t('medicine.today.perDay', {
    qty: formatQty(perDay),
    unit: formatUnitLabel(unit || 'pcs', t),
  })
}
