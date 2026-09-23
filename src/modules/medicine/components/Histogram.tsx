import { useTranslation } from 'react-i18next'
import { formatPerDay, formatQty, formatUnitLabel } from '../utils/format'
import { rainbowColor } from '../utils/colors'
import type { MedicineBar } from '../utils/stats'

type Props = {
  bars: MedicineBar[]
  compare: boolean
  totalCurrent: number
  totalPrevious: number
  /** Inclusive days in the current range. */
  dayCount: number
  /** Inclusive days in the compared range (when compare is on). */
  previousDayCount?: number
  showPerDay: boolean
}

export function Histogram({
  bars,
  compare,
  totalCurrent,
  totalPrevious,
  dayCount,
  previousDayCount,
  showPerDay,
}: Props) {
  const { t } = useTranslation()
  const max = Math.max(1, ...bars.map((b) => Math.max(b.current, compare ? b.previous : 0)))
  const defaultUnit = formatUnitLabel('pcs', t)
  const prevDays = previousDayCount ?? dayCount

  if (bars.length === 0) {
    return (
      <div className="chart-card">
        <p className="meta chart-empty">{t('medicine.today.emptyChart')}</p>
      </div>
    )
  }

  return (
    <div className="chart-card">
      <div className="chart-totals">
        <div>
          {compare ? <span className="meta">{t('medicine.today.current')}</span> : null}
          <strong>
            {t('common.total')}: {formatQty(totalCurrent)}
            {showPerDay ? (
              <span className="meta per-day">
                {' '}
                · {formatPerDay(totalCurrent, dayCount, 'pcs', t)}
              </span>
            ) : null}
          </strong>
        </div>
        {compare ? (
          <div>
            <span className="meta">{t('medicine.today.previous')}</span>
            <strong>
              {t('common.total')}: {formatQty(totalPrevious)}
              {showPerDay ? (
                <span className="meta per-day">
                  {' '}
                  · {formatPerDay(totalPrevious, prevDays, 'pcs', t)}
                </span>
              ) : null}
            </strong>
          </div>
        ) : null}
      </div>

      <div className="histogram" role="img" aria-label={t('medicine.today.chartTitle')}>
        {bars.map((bar, index) => {
          const unitLabel = bar.unit ? formatUnitLabel(bar.unit, t) : defaultUnit
          const color = rainbowColor(index, bars.length)
          return (
            <div key={bar.medicineId} className="histogram-row">
              <div className="histogram-label">
                <span className="histogram-name">{bar.name}</span>
                <span className="meta">
                  {formatQty(bar.current)} {unitLabel}
                  {showPerDay ? ` · ${formatPerDay(bar.current, dayCount, bar.unit || 'pcs', t)}` : ''}
                  {compare ? ` / ${formatQty(bar.previous)}` : ''}
                  {compare && showPerDay
                    ? ` · ${formatPerDay(bar.previous, prevDays, bar.unit || 'pcs', t)}`
                    : ''}
                </span>
              </div>
              <div className="histogram-tracks">
                <div
                  className="histogram-bar current"
                  style={{
                    width: `${(bar.current / max) * 100}%`,
                    background: color,
                  }}
                  title={`${formatQty(bar.current)}`}
                />
                {compare ? (
                  <div
                    className="histogram-bar previous"
                    style={{
                      width: `${(bar.previous / max) * 100}%`,
                      background: color,
                    }}
                    title={`${t('medicine.today.previous')}: ${formatQty(bar.previous)}`}
                  />
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {compare ? (
        <div className="chart-legend">
          <span>
            <i className="swatch current" /> {t('medicine.today.current')}
          </span>
          <span>
            <i className="swatch previous" /> {t('medicine.today.previous')}
          </span>
        </div>
      ) : null}
    </div>
  )
}
