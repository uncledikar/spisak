import { useTranslation } from 'react-i18next'
import { formatAmount } from '../utils/format'
import { rainbowColor } from '../utils/colors'
import type { CategoryBar } from '../utils/stats'

type Props = {
  bars: CategoryBar[]
  compare: boolean
  totalCurrent: number
  totalPrevious: number
  currentLabel?: string
  previousLabel?: string
}

export function Histogram({
  bars,
  compare,
  totalCurrent,
  totalPrevious,
  currentLabel,
  previousLabel,
}: Props) {
  const { t } = useTranslation()
  const max = Math.max(1, ...bars.map((b) => Math.max(b.current, compare ? b.previous : 0)))
  const legendColor = rainbowColor(0, Math.max(1, bars.length))

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
          {compare ? (
            <span className="meta chart-period-label">
              <i className="swatch" style={{ background: legendColor }} aria-hidden="true" />
              {currentLabel}
            </span>
          ) : null}
          <strong>
            {t('common.total')}: {formatAmount(totalCurrent)}
          </strong>
        </div>
        {compare ? (
          <div>
            <span className="meta chart-period-label">
              <i
                className="swatch swatch-faded"
                style={{ background: legendColor }}
                aria-hidden="true"
              />
              {previousLabel}
            </span>
            <strong>
              {t('common.total')}: {formatAmount(totalPrevious)}
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
                  <span className="histogram-icon" aria-hidden="true">
                    {bar.icon}
                  </span>
                  {bar.name}
                </span>
                <span className="meta">
                  {formatAmount(bar.current)}
                  {compare ? ` / ${formatAmount(bar.previous)}` : ''}
                </span>
              </div>
              <div className="histogram-tracks">
                <div
                  className="histogram-bar current"
                  style={{
                    width: `${(bar.current / max) * 100}%`,
                    background: color,
                  }}
                  title={formatAmount(bar.current)}
                />
                {compare ? (
                  <div
                    className="histogram-bar previous"
                    style={{
                      width: `${(bar.previous / max) * 100}%`,
                      background: color,
                    }}
                    title={`${previousLabel}: ${formatAmount(bar.previous)}`}
                  />
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
