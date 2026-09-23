import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from 'date-fns'
import type { DateRange, PeriodKind } from '../types/models'

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function resolveRange(kind: PeriodKind, anchor: string, custom?: DateRange): DateRange {
  if (kind === 'custom' && custom) {
    return custom.start <= custom.end
      ? custom
      : { start: custom.end, end: custom.start }
  }

  const day = parseISO(anchor)
  switch (kind) {
    case 'day':
    case 'date':
      return { start: toDateKey(day), end: toDateKey(day) }
    case 'week': {
      const start = startOfWeek(day, { weekStartsOn: 1 })
      const end = endOfWeek(day, { weekStartsOn: 1 })
      return { start: toDateKey(start), end: toDateKey(end) }
    }
    case 'month':
      return { start: toDateKey(startOfMonth(day)), end: toDateKey(endOfMonth(day)) }
    case 'year':
      return { start: toDateKey(startOfYear(day)), end: toDateKey(endOfYear(day)) }
    default:
      return { start: toDateKey(day), end: toDateKey(day) }
  }
}

/** Previous analogous period of the same length. */
export function previousRange(kind: PeriodKind, current: DateRange): DateRange {
  const start = parseISO(current.start)
  const end = parseISO(current.end)
  const length = differenceInCalendarDays(end, start)

  switch (kind) {
    case 'day':
    case 'date': {
      const prev = subDays(start, 1)
      return { start: toDateKey(prev), end: toDateKey(prev) }
    }
    case 'week': {
      const prevStart = subDays(start, 7)
      const prevEnd = subDays(end, 7)
      return { start: toDateKey(prevStart), end: toDateKey(prevEnd) }
    }
    case 'month': {
      const prevStart = startOfMonth(subMonths(start, 1))
      const prevEnd = endOfMonth(subMonths(start, 1))
      return { start: toDateKey(prevStart), end: toDateKey(prevEnd) }
    }
    case 'year': {
      const prevStart = startOfYear(subYears(start, 1))
      const prevEnd = endOfYear(subYears(start, 1))
      return { start: toDateKey(prevStart), end: toDateKey(prevEnd) }
    }
    case 'custom': {
      const prevEnd = subDays(start, 1)
      const prevStart = subDays(prevEnd, length)
      return { start: toDateKey(prevStart), end: toDateKey(prevEnd) }
    }
  }
}

export function shiftAnchor(kind: PeriodKind, anchor: string, direction: -1 | 1): string {
  const day = parseISO(anchor)
  switch (kind) {
    case 'day':
    case 'date':
      return toDateKey(addDays(day, direction))
    case 'week':
      return toDateKey(addDays(day, direction * 7))
    case 'month':
      return toDateKey(addMonths(day, direction))
    case 'year':
      return toDateKey(addYears(day, direction))
    case 'custom':
      return toDateKey(addDays(day, direction))
  }
}

export function inRange(dateKey: string, range: DateRange): boolean {
  return dateKey >= range.start && dateKey <= range.end
}

/** Inclusive calendar-day count for a range (min 1). */
export function rangeDayCount(range: DateRange): number {
  const days = differenceInCalendarDays(parseISO(range.end), parseISO(range.start)) + 1
  return Math.max(1, days)
}

export function formatRangeLabel(range: DateRange, locale: string): string {
  if (range.start === range.end) {
    return format(parseISO(range.start), 'dd.MM.yyyy')
  }
  void locale
  return `${format(parseISO(range.start), 'dd.MM.yyyy')} – ${format(parseISO(range.end), 'dd.MM.yyyy')}`
}

export function startOfLocalDay(dateKey: string): Date {
  return startOfDay(parseISO(dateKey))
}

export function endOfLocalDay(dateKey: string): Date {
  return endOfDay(parseISO(dateKey))
}
