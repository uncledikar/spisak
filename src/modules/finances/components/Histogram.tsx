import { useTranslation } from 'react-i18next'
import { formatAmount, formatPerDay } from '../utils/format'
import { rainbowColor } from '../utils/colors'
import type { CategoryBar } from '../utils/stats'

type Props = {
  bars: CategoryBar[]
  compare: boolean
  totalCurrent: number
  totalPrevious: number
  dayCount: number
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
  const prevDays = previousDayCount ?? dayCount

  if (bars.length === 0) {
    return (
      <div className="chart-card">
        <p className="meta chart-empty">{t('finances.today.emptyChart')}</p>
      </div>
    )
  }

  return (
    <div className="chart-card">
      <div className="chart-totals">
        <div>
          <span className="meta">{t('finances.today.current')}</span>
          <strong>
            {t('common.total')}: {formatAmount(totalCurrent)}
            {showPerDay ? (
              <span className="meta per-day">
                {' '}
                · {formatPerDay(totalCurrent, dayCount, t)}
              </span>
            ) : null}
          </strong>
        </div>
        {compare ? (
          <div>
            <span className="meta">{t('finances.today.previous')}</span>
            <strong>
              {t('common.total')}: {formatAmount(totalPrevious)}
              {showPerDay ? (
                <span className="meta per-day">
                  {' '}
                  · {formatPerDay(totalPrevious, prevDays, t)}
                </span>
              ) : null}
            </strong>
          </div>
        ) : null}
      </div>

      <div className="histogram" role="img" aria-label={t('finances.today.chartTitle')}>
        {bars.map((bar, index) => {
          const color = rainbowColor(index, bars.length)
          return (
            <div key={bar.categoryId} className="histogram-row">
              <div className="histogram-label">
                <span className="histogram-name">
                  <i className="histogram-dot" style={{ background: color }} aria-hidden="true" />
                  <span className="histogram-icon" aria-hidden="true">
                    {bar.icon}
                  </span>
                  {bar.name}
                </span>
                <span className="meta">
                  {formatAmount(bar.current)}
                  {showPerDay ? ` · ${formatPerDay(bar.current, dayCount, t)}` : ''}
                  {compare ? ` / ${formatAmount(bar.previous)}` : ''}
                  {compare && showPerDay ? ` · ${formatPerDay(bar.previous, prevDays, t)}` : ''}
                </span>
              </div>
              <div className="histogram-tracks">
                <div
                  className="histogram-bar current"
                  style={{
                    width: `${(bar.current / max) * 100}%`,
                    background: color,
                  }}
                  title={`${t('finances.today.current')}: ${formatAmount(bar.current)}`}
                />
                {compare ? (
                  <div
                    className="histogram-bar previous"
                    style={{
                      width: `${(bar.previous / max) * 100}%`,
                      background: color,
                    }}
                    title={`${t('finances.today.previous')}: ${formatAmount(bar.previous)}`}
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
            <i className="swatch current" /> {t('finances.today.current')}
          </span>
          <span>
            <i className="swatch previous" /> {t('finances.today.previous')}
          </span>
        </div>
      ) : null}
    </div>
  )
}
