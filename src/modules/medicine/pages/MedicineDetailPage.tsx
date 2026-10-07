import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getConsumptions } from '../api/consumptions'
import { getMedicines } from '../api/medicines'
import { ModuleShell as PageShell } from '../components/ModuleShell'
import { useLiveData } from '../../../shared/hooks/useLiveData'
import { formatDisplayDate, formatQty, formatUnitLabel } from '../utils/format'
import { inRange, resolveRange } from '../utils/periods'
import { parsePeriodSearch, periodHref } from '../utils/periodQuery'
import { periodPageTitle } from '../utils/periodTitle'

export function MedicineDetailPage() {
  const { medicineId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const { t, i18n } = useTranslation()
  const medicines = useLiveData(() => getMedicines(), [])
  const consumptions = useLiveData(() => getConsumptions(), [])

  const period = useMemo(() => parsePeriodSearch(searchParams), [searchParams])
  const range = useMemo(
    () => resolveRange(period.kind, period.anchor, period.custom),
    [period],
  )
  const pageTitle = useMemo(
    () => periodPageTitle(period.kind, period.anchor, range, t, i18n.language),
    [period, range, t, i18n.language],
  )

  const medicine = medicines?.find((m) => m.id === medicineId) ?? null
  const backHref = periodHref('/medicine', period)

  const rows = useMemo(() => {
    if (!consumptions) return []
    return consumptions
      .filter((c) => c.medicineId === medicineId && inRange(c.consumedOn, range))
      .sort((a, b) => {
        if (a.consumedOn !== b.consumedOn) return b.consumedOn.localeCompare(a.consumedOn)
        return b.updatedAt - a.updatedAt
      })
  }, [consumptions, medicineId, range])

  const total = useMemo(() => rows.reduce((sum, row) => sum + row.quantity, 0), [rows])
  const unitLabel = medicine?.unit ? formatUnitLabel(medicine.unit, t) : ''

  return (
    <PageShell
      crumbs={[
        { label: t('nav.module.medicine'), to: backHref },
        { label: pageTitle, to: backHref },
        { label: medicine?.name ?? t('medicine.today.unknownMedicine') },
      ]}
    >
      <div className="stack page-stack">
        <div>
          <h2 className="section-title">
            {medicine?.name ?? t('medicine.today.unknownMedicine')}
          </h2>
          <p className="meta" style={{ margin: '6px 0 0' }}>
            {pageTitle} · {t('common.total')}: {formatQty(total)}
            {unitLabel ? ` ${unitLabel}` : ''}
          </p>
        </div>

        {!consumptions || !medicines ? (
          <p className="meta">{t('common.loading')}</p>
        ) : rows.length === 0 ? (
          <div className="empty">
            <h2>{t('medicine.today.medicineEmpty')}</h2>
          </div>
        ) : (
          <ul className="list-plain">
            {rows.map((row) => (
              <li key={row.id} className="list-row">
                <div>
                  <strong>
                    {formatQty(row.quantity)}
                    {unitLabel ? ` ${unitLabel}` : ''}
                  </strong>
                  <p className="meta">{formatDisplayDate(row.consumedOn)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  )
}
