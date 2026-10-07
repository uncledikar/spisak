import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCategories } from '../api/categories'
import { getExpenses } from '../api/expenses'
import { ModuleShell as PageShell } from '../components/ModuleShell'
import { useLiveData } from '../../../shared/hooks/useLiveData'
import { formatAmount, formatDisplayDate } from '../utils/format'
import { formatCompareLabel, inRange, resolveRange } from '../utils/periods'
import { parsePeriodSearch, periodHref } from '../utils/periodQuery'
import { periodPageTitle } from '../utils/periodTitle'

export function CategoryDetailPage() {
  const { categoryId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const { t, i18n } = useTranslation()
  const categories = useLiveData(() => getCategories(), [])
  const expenses = useLiveData(() => getExpenses(), [])

  const period = useMemo(() => parsePeriodSearch(searchParams), [searchParams])
  const range = useMemo(
    () => resolveRange(period.kind, period.anchor, period.custom),
    [period],
  )
  const pageTitle = useMemo(
    () => periodPageTitle(period.kind, period.anchor, range, t, i18n.language),
    [period, range, t, i18n.language],
  )

  const category = categories?.find((c) => c.id === categoryId) ?? null
  const backHref = periodHref('/finances', period)

  const rows = useMemo(() => {
    if (!expenses) return []
    return expenses
      .filter((e) => e.categoryId === categoryId && inRange(e.spentOn, range))
      .sort((a, b) => {
        if (a.spentOn !== b.spentOn) return b.spentOn.localeCompare(a.spentOn)
        return b.updatedAt - a.updatedAt
      })
  }, [expenses, categoryId, range])

  const total = useMemo(() => rows.reduce((sum, row) => sum + row.amount, 0), [rows])

  const periodLabel = useMemo(
    () => formatCompareLabel(period.kind, range, i18n.language),
    [period.kind, range, i18n.language],
  )

  const icon = category?.icon ?? '💳'

  return (
    <PageShell
      crumbs={[
        { label: t('nav.module.finances'), to: backHref },
        { label: pageTitle, to: backHref },
        { label: category?.name ?? t('finances.today.unknownCategory') },
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
            <h2>{t('finances.today.categoryEmpty')}</h2>
          </div>
        ) : (
          <ul className="list-plain">
            {rows.map((row) => (
              <li key={row.id} className="list-row">
                <div>
                  <strong>{formatAmount(row.amount)}</strong>
                  <p className="meta">
                    {formatDisplayDate(row.spentOn)}
                    {row.comment ? ` · ${row.comment}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  )
}
