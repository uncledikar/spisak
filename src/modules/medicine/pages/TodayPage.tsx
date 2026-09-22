import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getConsumptions, deleteConsumption } from '../api/consumptions'
import { getMedicines } from '../api/medicines'
import { ModuleShell as PageShell } from '../components/ModuleShell'
import { Histogram } from '../components/Histogram'
import { IconActionButton } from '../components/IconActionButton'
import { LogConsumptionForm } from '../components/LogConsumptionForm'
import { PeriodControls } from '../components/PeriodControls'
import { useLiveData } from '../../../shared/hooks/useLiveData'
import type { DateRange, PeriodKind } from '../types/models'
import { formatDisplayDate, formatUnitLabel } from '../utils/format'
import {
  formatRangeLabel,
  previousRange,
  rangeDayCount,
  resolveRange,
  shiftAnchor,
  todayKey,
} from '../utils/periods'
import { aggregateByMedicine } from '../utils/stats'

function periodPageTitle(
  kind: PeriodKind,
  anchor: string,
  range: DateRange,
  t: (key: string) => string,
  locale: string,
): string {
  if (kind === 'day') {
    return anchor === todayKey() ? t('period.day') : formatDisplayDate(anchor)
  }
  if (kind === 'custom') {
    return formatRangeLabel(range, locale)
  }
  return t(`period.${kind}`)
}

export function TodayPage() {
  const { t, i18n } = useTranslation()
  const medicines = useLiveData(() => getMedicines(), [])
  const consumptions = useLiveData(() => getConsumptions(), [])

  const [kind, setKind] = useState<PeriodKind>('day')
  const [anchor, setAnchor] = useState(todayKey())
  const [custom, setCustom] = useState<DateRange>({ start: todayKey(), end: todayKey() })
  const [compare, setCompare] = useState(false)

  const range = useMemo(() => resolveRange(kind, anchor, custom), [kind, anchor, custom])
  const prev = useMemo(() => (compare ? previousRange(kind, range) : null), [compare, kind, range])
  const dayCount = useMemo(() => rangeDayCount(range), [range])
  const previousDayCount = useMemo(() => (prev ? rangeDayCount(prev) : dayCount), [prev, dayCount])
  const showPerDay = kind !== 'day'
  const pageTitle = useMemo(
    () => periodPageTitle(kind, anchor, range, t, i18n.language),
    [kind, anchor, range, t, i18n.language],
  )

  const stats = useMemo(() => {
    if (!medicines || !consumptions) return null
    return aggregateByMedicine(consumptions, medicines, range, prev)
  }, [medicines, consumptions, range, prev])

  const dayEntries = useMemo(() => {
    if (kind !== 'day' || !consumptions || !medicines) return []
    const nameById = new Map(medicines.map((m) => [m.id, m]))
    return consumptions
      .filter((c) => c.consumedOn === anchor)
      .map((c) => ({
        ...c,
        name: nameById.get(c.medicineId)?.name ?? '—',
        unit: nameById.get(c.medicineId)?.unit ?? '',
      }))
  }, [kind, anchor, consumptions, medicines])

  return (
    <PageShell crumbs={[{ label: pageTitle }]}>
      <div className="stack page-stack">
        <PeriodControls
          kind={kind}
          anchor={anchor}
          custom={custom}
          compare={compare}
          range={range}
          onKind={(next) => {
            setKind(next)
            if (next !== 'custom') setAnchor(todayKey())
          }}
          onAnchor={setAnchor}
          onCustom={setCustom}
          onCompare={setCompare}
          onShift={(dir) => setAnchor((a) => shiftAnchor(kind, a, dir))}
        />

        {stats ? (
          <Histogram
            bars={stats.bars}
            compare={compare}
            totalCurrent={stats.totalCurrent}
            totalPrevious={stats.totalPrevious}
            dayCount={dayCount}
            previousDayCount={previousDayCount}
            showPerDay={showPerDay}
          />
        ) : (
          <p className="meta">{t('common.loading')}</p>
        )}

        <LogConsumptionForm medicines={medicines ?? []} />

        {kind === 'day' && dayEntries.length > 0 ? (
          <section className="stack">
            <h2 className="section-title">{t('medicine.today.dayMedicines')}</h2>
            <ul className="list-plain">
              {dayEntries.map((row) => (
                <li key={row.id} className="list-row">
                  <div>
                    <strong>{row.name}</strong>
                    <p className="meta">
                      {formatDisplayDate(row.consumedOn)} · {row.quantity}
                      {row.unit ? ` ${formatUnitLabel(row.unit, t)}` : ''}
                    </p>
                  </div>
                  <IconActionButton
                    label={t('common.delete')}
                    variant="danger"
                    onClick={() => void deleteConsumption(row.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </PageShell>
  )
}
