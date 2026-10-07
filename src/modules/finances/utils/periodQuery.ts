import type { DateRange, PeriodKind } from '../types/models'
import { todayKey } from './periods'

const KINDS: PeriodKind[] = ['day', 'week', 'month', 'year', 'custom', 'date']

export type PeriodState = {
  kind: PeriodKind
  anchor: string
  custom: DateRange
  compare: boolean
}

export function defaultPeriodState(): PeriodState {
  const today = todayKey()
  return {
    kind: 'day',
    anchor: today,
    custom: { start: today, end: today },
    compare: false,
  }
}

export function parsePeriodSearch(params: URLSearchParams): PeriodState {
  const base = defaultPeriodState()
  const kindRaw = params.get('kind')
  const kind = KINDS.includes(kindRaw as PeriodKind) ? (kindRaw as PeriodKind) : base.kind
  const anchor = params.get('anchor') || base.anchor
  const customStart = params.get('from') || base.custom.start
  const customEnd = params.get('to') || base.custom.end
  const compare = params.get('compare') === '1'
  return {
    kind,
    anchor,
    custom: { start: customStart, end: customEnd },
    compare: kind === 'custom' ? false : compare,
  }
}

export function periodSearchString(state: PeriodState): string {
  const params = new URLSearchParams()
  params.set('kind', state.kind)
  params.set('anchor', state.anchor)
  if (state.kind === 'custom') {
    params.set('from', state.custom.start)
    params.set('to', state.custom.end)
  }
  if (state.compare && state.kind !== 'custom') params.set('compare', '1')
  return params.toString()
}

export function periodHref(path: string, state: PeriodState): string {
  const qs = periodSearchString(state)
  return qs ? `${path}?${qs}` : path
}
