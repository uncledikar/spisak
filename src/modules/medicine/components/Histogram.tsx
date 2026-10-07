import { useTranslation } from 'react-i18next'
import { formatQty, formatUnitLabel } from '../utils/format'
import { rainbowColor } from '../utils/colors'
import type { MedicineBar } from '../utils/stats'

type Props = {
  bars: MedicineBar[]
  compare: boolean
  totalCurrent: number
  totalPrevious: number
  currentLabel?: string
  previousLabel?: string
  onSelectBar?: (medicineId: string) => void
}

export function Histogram({
  bars,
  compare,
  totalCurrent,
  totalPrevious,
  currentLabel,
  previousLabel,
  onSelectBar,
}: Props) {
  const { t } = useTranslation()
  const max = Math.max(1, ...bars.map((b) => Math.max(b.current, compare ? b.previous : 0)))
  const defaultUnit = formatUnitLabel('pcs', t)
  const legendColor = rainbowColor(0, Math.max(1, bars.length))

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
          {compare ? (
            <span className="meta chart-period-label">
              <i className="swatch" style={{ background: legendColor }} aria-hidden="true" />
              {currentLabel}
            </span>
          ) : null}
          <strong>
            {t('common.total')}: {formatQty(totalCurrent)}
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
              {t('common.total')}: {formatQty(totalPrevious)}
            </strong>
          </div>
        ) : null}
      </div>

      <div className="histogram" role="list" aria-label={t('medicine.today.chartTitle')}>
        {bars.map((bar, index) => {
          const unitLabel = bar.unit ? formatUnitLabel(bar.unit, t) : defaultUnit
          const color = rainbowColor(index, bars.length)
          return (
            <div key={bar.medicineId} className="histogram-row" role="listitem">
              <div className="histogram-label">
                {onSelectBar ? (
                  <button
                    type="button"
                    className="histogram-name histogram-name-btn"
                    onClick={() => onSelectBar(bar.medicineId)}
                  >
                    {bar.name}
                  </button>
                ) : (
                  <span className="histogram-name">{bar.name}</span>
                )}
                <span className="meta">
                  {formatQty(bar.current)} {unitLabel}
                  {compare ? ` / ${formatQty(bar.previous)}` : ''}
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
                    title={`${previousLabel}: ${formatQty(bar.previous)}`}
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
