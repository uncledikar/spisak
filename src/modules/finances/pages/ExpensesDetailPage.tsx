import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCategories } from '../api/categories'
import { getExpenses } from '../api/expenses'
import { LogExpenseForm } from '../components/LogExpenseForm'
import { ModuleShell as PageShell } from '../components/ModuleShell'
import { useLiveData } from '../../../shared/hooks/useLiveData'
import type { Expense } from '../types/models'
import { formatAmount, formatDisplayDate } from '../utils/format'
import { formatCompareLabel, inRange, resolveRange } from '../utils/periods'
import { parsePeriodSearch, periodHref } from '../utils/periodQuery'
import { periodPageTitle } from '../utils/periodTitle'

type Props = {
  /** When set, only that category; otherwise all expenses in the period. */
  scope: 'category' | 'all'
}

function ExpensesDetail({ scope }: Props) {
  const { categoryId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const { t, i18n } = useTranslation()
  const categories = useLiveData(() => getCategories(), [])
  const expenses = useLiveData(() => getExpenses(), [])
  const [editing, setEditing] = useState<Expense | null>(null)

  const period = useMemo(() => parsePeriodSearch(searchParams), [searchParams])
  const range = useMemo(
    () => resolveRange(period.kind, period.anchor, period.custom),
    [period],
  )
  const pageTitle = useMemo(
    () => periodPageTitle(period.kind, period.anchor, range, t, i18n.language),
    [period, range, t, i18n.language],
  )
  const periodLabel = useMemo(
    () => formatCompareLabel(period.kind, range, i18n.language),
    [period.kind, range, i18n.language],
  )

  const category =
    scope === 'category' ? (categories?.find((c) => c.id === categoryId) ?? null) : null
  const backHref = periodHref('/finances', period)
  const categoryById = useMemo(
    () => new Map((categories ?? []).map((c) => [c.id, c])),
    [categories],
  )

  const rows = useMemo(() => {
    if (!expenses) return []
    return expenses
      .filter((e) => {
        if (!inRange(e.spentOn, range)) return false
        if (scope === 'category') return e.categoryId === categoryId
        return true
      })
      .sort((a, b) => {
        if (a.spentOn !== b.spentOn) return b.spentOn.localeCompare(a.spentOn)
        return b.updatedAt - a.updatedAt
      })
  }, [expenses, categoryId, range, scope])

  const total = useMemo(() => rows.reduce((sum, row) => sum + row.amount, 0), [rows])

  const crumbLabel =
    scope === 'category'
      ? (category?.name ?? t('finances.today.unknownCategory'))
      : t('finances.today.allExpenses')
  const icon = scope === 'category' ? (category?.icon ?? '💳') : '∑'

  return (
    <PageShell
      crumbs={[
        { label: t('nav.module.finances'), to: backHref },
        { label: pageTitle, to: backHref },
        { label: crumbLabel },
      ]}
    >
      <div className="stack page-stack">
        <div className="row-between" style={{ alignItems: 'baseline', gap: 12 }}>
          <h2 className="section-title" style={{ margin: 0 }}>
            <span aria-hidden="true">{icon}</span>{' '}
            {t('common.total')}: {formatAmount(total)}
          </h2>
          <p className="meta" style={{ margin: 0, flexShrink: 0, textAlign: 'right' }}>
            {periodLabel}
          </p>
        </div>

        {!expenses || !categories ? (
          <p className="meta">{t('common.loading')}</p>
        ) : rows.length === 0 ? (
          <div className="empty">
            <h2>
              {scope === 'category'
                ? t('finances.today.categoryEmpty')
                : t('finances.today.periodEmpty')}
            </h2>
          </div>
        ) : (
          <ul className="list-plain">
            {rows.map((row) => {
              const cat = categoryById.get(row.categoryId)
              return (
                <li key={row.id} className="list-row">
                  <button
                    type="button"
                    className="expense-row-btn"
                    onClick={() => setEditing(row)}
                  >
                    <strong>{formatAmount(row.amount)}</strong>
                    <p className="meta">
                      {scope === 'all' ? (
                        <>
                          <span className="entry-icon" aria-hidden="true">
                            {cat?.icon ?? '💳'}
                          </span>{' '}
                          {cat?.name ?? t('finances.today.unknownCategory')}
                          {' · '}
                        </>
                      ) : null}
                      {formatDisplayDate(row.spentOn)}
                      {row.comment ? ` · ${row.comment}` : ''}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <LogExpenseForm
          open={Boolean(editing)}
          onClose={() => setEditing(null)}
          categories={categories ?? []}
          defaultDate={editing?.spentOn ?? period.anchor}
          expense={editing}
        />
      </div>
    </PageShell>
  )
}

export function CategoryDetailPage() {
  return <ExpensesDetail scope="category" />
}

export function PeriodExpensesPage() {
  return <ExpensesDetail scope="all" />
}
