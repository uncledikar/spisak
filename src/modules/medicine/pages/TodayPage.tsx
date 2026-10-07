import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getConsumptions, deleteConsumption } from '../api/consumptions'
import { getMedicines } from '../api/medicines'
import { ModuleShell as PageShell } from '../components/ModuleShell'
import { Histogram } from '../components/Histogram'
import { IconActionButton } from '../components/IconActionButton'
import { LogConsumptionForm } from '../components/LogConsumptionForm'
import { PeriodControls } from '../components/PeriodControls'
import { useLiveData } from '../../../shared/hooks/useLiveData'
import type { Consumption, PeriodKind } from '../types/models'
import { formatDisplayDate, formatUnitLabel } from '../utils/format'
import {
  formatCompareLabel,
  previousRange,
  resolveRange,
  shiftAnchor,
  todayKey,
} from '../utils/periods'
import { parsePeriodSearch, periodHref, periodSearchString } from '../utils/periodQuery'
import { periodPageTitle } from '../utils/periodTitle'
import { aggregateByMedicine } from '../utils/stats'

function singleDayKindFor(anchor: string): 'day' | 'date' {
  return anchor === todayKey() ? 'day' : 'date'
}

export function TodayPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const medicines = useLiveData(() => getMedicines(), [])
  const consumptions = useLiveData(() => getConsumptions(), [])

  const initial = useMemo(() => parsePeriodSearch(searchParams), [searchParams])
  const [kind, setKind] = useState<PeriodKind>(initial.kind)
  const [anchor, setAnchor] = useState(initial.anchor)
  const [custom, setCustom] = useState(initial.custom)
  const [compare, setCompare] = useState(initial.compare)
  const [logOpen, setLogOpen] = useState(false)
  const [editing, setEditing] = useState<Consumption | null>(null)

  useEffect(() => {
    const next = parsePeriodSearch(searchParams)
    setKind(next.kind)
    setAnchor(next.anchor)
    setCustom(next.custom)
    setCompare(next.compare)
  }, [searchParams])

  useEffect(() => {
    const qs = periodSearchString({ kind, anchor, custom, compare })
    if (qs !== searchParams.toString()) {
      setSearchParams(qs, { replace: true })
    }
  }, [kind, anchor, custom, compare, searchParams, setSearchParams])

  const range = useMemo(() => resolveRange(kind, anchor, custom), [kind, anchor, custom])
  const compareEnabled = compare && kind !== 'custom'
  const prev = useMemo(
    () => (compareEnabled ? previousRange(kind, range) : null),
    [compareEnabled, kind, range],
  )
  const isSingleDay = kind === 'day' || kind === 'date'
  const pageTitle = useMemo(
    () => periodPageTitle(kind, anchor, range, t, i18n.language),
    [kind, anchor, range, t, i18n.language],
  )
  const currentLabel = useMemo(
    () => formatCompareLabel(kind, range, i18n.language),
    [kind, range, i18n.language],
  )
  const previousLabel = useMemo(
    () => (prev ? formatCompareLabel(kind, prev, i18n.language) : ''),
    [kind, prev, i18n.language],
  )
  const periodState = useMemo(
    () => ({ kind, anchor, custom, compare }),
    [kind, anchor, custom, compare],
  )

  const stats = useMemo(() => {
    if (!medicines || !consumptions) return null
    return aggregateByMedicine(consumptions, medicines, range, prev)
  }, [medicines, consumptions, range, prev])

  const dayEntries = useMemo(() => {
    if (!isSingleDay || !consumptions || !medicines) return []
    const nameById = new Map(medicines.map((m) => [m.id, m]))
    return consumptions
      .filter((c) => c.consumedOn === anchor)
      .map((c) => ({
        ...c,
        name: nameById.get(c.medicineId)?.name ?? '—',
        unit: nameById.get(c.medicineId)?.unit ?? '',
      }))
  }, [isSingleDay, anchor, consumptions, medicines])

  return (
    <PageShell crumbs={[{ label: t('nav.module.medicine') }, { label: pageTitle }]}>
      <div className="stack page-stack">
        <PeriodControls
          kind={kind}
          anchor={anchor}
          custom={custom}
          compare={compare}
          range={range}
          onKind={(next) => {
            if (next === 'custom') setCompare(false)
            if (next === 'day') {
              setKind('day')
              setAnchor(todayKey())
              return
            }
            if (next === 'date') {
              if (kind === 'day' || kind === 'date') {
                setKind(singleDayKindFor(anchor))
              } else {
                setKind('day')
                setAnchor(todayKey())
              }
              return
            }
            setKind(next)
            if (next !== 'custom') setAnchor(todayKey())
          }}
          onAnchor={(next) => {
            setAnchor(next)
            setKind(singleDayKindFor(next))
          }}
          onCustom={setCustom}
          onCompare={setCompare}
          onShift={(dir) => {
            const next = shiftAnchor(kind, anchor, dir)
            setAnchor(next)
            if (kind === 'day' || kind === 'date') {
              setKind(singleDayKindFor(next))
            }
          }}
        />

        {stats ? (
          <Histogram
            bars={stats.bars}
            compare={compareEnabled}
            totalCurrent={stats.totalCurrent}
            totalPrevious={stats.totalPrevious}
            currentLabel={currentLabel}
            previousLabel={previousLabel}
            onSelectBar={(medicineId) => {
              navigate(periodHref(`/medicine/medicine/${medicineId}`, periodState))
            }}
          />
        ) : (
          <p className="meta">{t('common.loading')}</p>
        )}

        <button type="button" className="fab" onClick={() => setLogOpen(true)}>
          + {t('medicine.today.log')}
        </button>
        <LogConsumptionForm
          open={logOpen}
          onClose={() => setLogOpen(false)}
          medicines={medicines ?? []}
          defaultDate={isSingleDay ? anchor : todayKey()}
        />
        <LogConsumptionForm
          open={Boolean(editing)}
          onClose={() => setEditing(null)}
          medicines={medicines ?? []}
          defaultDate={editing?.consumedOn ?? (isSingleDay ? anchor : todayKey())}
          consumption={editing}
        />

        {isSingleDay && dayEntries.length > 0 ? (
          <section className="stack">
            <h2 className="section-title">
              {t('medicine.today.dayMedicines', { date: formatDisplayDate(anchor) })}
            </h2>
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
                  <div className="row row-actions">
                    <IconActionButton
                      label={t('common.edit')}
                      onClick={() => setEditing(row)}
                    />
                    <IconActionButton
                      label={t('common.delete')}
                      variant="danger"
                      onClick={() => void deleteConsumption(row.id)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </PageShell>
  )
}
