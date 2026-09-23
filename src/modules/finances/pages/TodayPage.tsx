import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getExpenses, deleteExpense } from '../api/expenses'
import { getCategories } from '../api/categories'
import { ModuleShell as PageShell } from '../components/ModuleShell'
import { Histogram } from '../components/Histogram'
import { IconActionButton } from '../components/IconActionButton'
import { LogExpenseForm } from '../components/LogExpenseForm'
import { PeriodControls } from '../components/PeriodControls'
import { useLiveData } from '../../../shared/hooks/useLiveData'
import type { DateRange, PeriodKind } from '../types/models'
import { formatAmount, formatDisplayDate } from '../utils/format'
import {
  formatRangeLabel,
  previousRange,
  rangeDayCount,
  resolveRange,
  shiftAnchor,
  todayKey,
} from '../utils/periods'
import { aggregateByCategory } from '../utils/stats'

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
  const categories = useLiveData(() => getCategories(), [])
  const expenses = useLiveData(() => getExpenses(), [])

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
    if (!categories || !expenses) return null
    return aggregateByCategory(expenses, categories, range, prev)
  }, [categories, expenses, range, prev])

  const dayEntries = useMemo(() => {
    if (kind !== 'day' || !expenses || !categories) return []
    const byId = new Map(categories.map((c) => [c.id, c]))
    return expenses
      .filter((e) => e.spentOn === anchor)
      .map((e) => ({
        ...e,
        name: byId.get(e.categoryId)?.name ?? '—',
        icon: byId.get(e.categoryId)?.icon ?? '💳',
      }))
  }, [kind, anchor, expenses, categories])

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

        <LogExpenseForm categories={categories ?? []} />

        {kind === 'day' && dayEntries.length > 0 ? (
          <section className="stack">
            <h2 className="section-title">
              {t('finances.today.dayExpenses', { date: formatDisplayDate(anchor) })}
            </h2>
            <ul className="list-plain">
              {dayEntries.map((row) => (
                <li key={row.id} className="list-row">
                  <div>
                    <strong>
                      <span className="entry-icon" aria-hidden="true">
                        {row.icon}
                      </span>{' '}
                      {row.name}
                    </strong>
                    <p className="meta">
                      {formatDisplayDate(row.spentOn)} · {formatAmount(row.amount)}
                      {row.comment ? ` · ${row.comment}` : ''}
                    </p>
                  </div>
                  <IconActionButton
                    label={t('common.delete')}
                    variant="danger"
                    onClick={() => void deleteExpense(row.id)}
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
