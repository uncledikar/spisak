import type { DateRange, PeriodKind } from '../types/models'
import { formatDisplayDate } from './format'
import { formatRangeLabel } from './periods'

export function periodPageTitle(
  kind: PeriodKind,
  anchor: string,
  range: DateRange,
  t: (key: string) => string,
  locale: string,
): string {
  if (kind === 'day') return t('period.day')
  if (kind === 'date') return formatDisplayDate(anchor)
  if (kind === 'custom') return formatRangeLabel(range, locale)
  return t(`period.${kind}`)
}
