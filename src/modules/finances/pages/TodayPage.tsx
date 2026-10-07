import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getExpenses, deleteExpense } from '../api/expenses'
import { getCategories } from '../api/categories'
import { ModuleShell as PageShell } from '../components/ModuleShell'
import { Histogram } from '../components/Histogram'
import { IconActionButton } from '../components/IconActionButton'
import { LogExpenseForm } from '../components/LogExpenseForm'
import { PeriodControls } from '../components/PeriodControls'
import { useLiveData } from '../../../shared/hooks/useLiveData'
import type { Expense, PeriodKind } from '../types/models'
import { formatAmount, formatDisplayDate } from '../utils/format'
import {
  formatCompareLabel,
  previousRange,
  resolveRange,
  shiftAnchor,
  todayKey,
} from '../utils/periods'
import { parsePeriodSearch, periodHref, periodSearchString } from '../utils/periodQuery'
import { periodPageTitle } from '../utils/periodTitle'
import { aggregateByCategory } from '../utils/stats'

function singleDayKindFor(anchor: string): 'day' | 'date' {
  return anchor === todayKey() ? 'day' : 'date'
}

export function TodayPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const categories = useLiveData(() => getCategories(), [])
  const expenses = useLiveData(() => getExpenses(), [])

  const initial = useMemo(() => parsePeriodSearch(searchParams), [searchParams])
  const [kind, setKind] = useState<PeriodKind>(initial.kind)
  const [anchor, setAnchor] = useState(initial.anchor)
  const [custom, setCustom] = useState(initial.custom)
  const [compare, setCompare] = useState(initial.compare)
  const [logOpen, setLogOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)

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
    if (!categories || !expenses) return null
    return aggregateByCategory(expenses, categories, range, prev)
  }, [categories, expenses, range, prev])

  const dayEntries = useMemo(() => {
    if (!isSingleDay || !expenses || !categories) return []
    const byId = new Map(categories.map((c) => [c.id, c]))
    return expenses
      .filter((e) => e.spentOn === anchor)
      .map((e) => ({
        ...e,
        name: byId.get(e.categoryId)?.name ?? '—',
        icon: byId.get(e.categoryId)?.icon ?? '💳',
      }))
  }, [isSingleDay, anchor, expenses, categories])

  return (
    <PageShell crumbs={[{ label: t('nav.module.finances') }, { label: pageTitle }]}>
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
            onSelectBar={(categoryId) => {
              navigate(periodHref(`/finances/category/${categoryId}`, periodState))
            }}
          />
        ) : (
          <p className="meta">{t('common.loading')}</p>
        )}

        <button type="button" className="fab" onClick={() => setLogOpen(true)}>
          + {t('finances.today.log')}
        </button>
        <LogExpenseForm
          open={logOpen}
          onClose={() => setLogOpen(false)}
          categories={categories ?? []}
          defaultDate={isSingleDay ? anchor : todayKey()}
        />
        <LogExpenseForm
          open={Boolean(editing)}
          onClose={() => setEditing(null)}
          categories={categories ?? []}
          defaultDate={editing?.spentOn ?? (isSingleDay ? anchor : todayKey())}
          expense={editing}
        />

        {isSingleDay && dayEntries.length > 0 ? (
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
                  <div className="row row-actions">
                    <IconActionButton
                      label={t('common.edit')}
                      onClick={() => setEditing(row)}
                    />
                    <IconActionButton
                      label={t('common.delete')}
                      variant="danger"
                      onClick={() => void deleteExpense(row.id)}
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
