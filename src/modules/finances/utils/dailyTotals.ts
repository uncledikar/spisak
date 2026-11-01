import { addDays, differenceInCalendarDays, parseISO } from 'date-fns'
import type { DateRange } from '../types/models'
import { toDateKey } from './periods'

export type DayTotal = {
  date: string
  amount: number
}

/** Sum expenses per calendar day across the inclusive range (missing days → 0). */
export function aggregateDailyTotals(
  expenses: { spentOn: string; amount: number }[],
  range: DateRange,
): DayTotal[] {
  const byDay = new Map<string, number>()
  for (const row of expenses) {
    byDay.set(row.spentOn, (byDay.get(row.spentOn) ?? 0) + row.amount)
  }

  const start = parseISO(range.start)
  const count = Math.max(1, differenceInCalendarDays(parseISO(range.end), start) + 1)
  const days: DayTotal[] = []
  for (let i = 0; i < count; i++) {
    const date = toDateKey(addDays(start, i))
    days.push({ date, amount: byDay.get(date) ?? 0 })
  }
  return days
}

/** Nice Y-axis ticks from 0 up to at least `max`. */
export function niceAmountTicks(max: number, targetCount = 4): number[] {
  if (!Number.isFinite(max) || max <= 0) return [0, 1]
  const rough = max / Math.max(1, targetCount)
  const power = Math.pow(10, Math.floor(Math.log10(rough)))
  const candidates = [1, 2, 2.5, 5, 10].map((n) => n * power)
  const step = candidates.find((n) => n >= rough) ?? power * 10
  const top = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = 0; v <= top + step / 1000; v += step) {
    ticks.push(Math.round(v * 100) / 100)
  }
  return ticks
}
