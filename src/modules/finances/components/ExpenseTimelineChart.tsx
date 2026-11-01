import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatAmount } from '../utils/format'
import { aggregateDailyTotals, niceAmountTicks } from '../utils/dailyTotals'
import type { DateRange } from '../types/models'

type Props = {
  expenses: { spentOn: string; amount: number }[]
  range: DateRange
}

/** DD.MM without year — for week/month axis labels. */
function shortDateLabel(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!m) return date
  return `${m[3]}.${m[2]}`
}

function xLabel(date: string, dayCount: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!m) return date
  // Year-long / custom dense ranges: day-of-month only.
  if (dayCount > 45) return `${Number(m[3])}`
  // Week & month: DD.MM, never year.
  return shortDateLabel(date)
}

export function ExpenseTimelineChart({ expenses, range }: Props) {
  const { t } = useTranslation()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const series = useMemo(() => aggregateDailyTotals(expenses, range), [expenses, range])
  const maxAmount = useMemo(
    () => series.reduce((max, day) => Math.max(max, day.amount), 0),
    [series],
  )
  const yTicks = useMemo(() => niceAmountTicks(maxAmount), [maxAmount])
  const yMax = yTicks[yTicks.length - 1] ?? 1
  const selected = selectedDate ? series.find((d) => d.date === selectedDate) : null

  const width = 360
  const height = 220
  const pad = { top: 12, right: 8, bottom: 36, left: 44 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const n = series.length
  const gap = n <= 14 ? 0.22 : n <= 40 ? 0.12 : 0.04
  const slot = plotW / Math.max(1, n)
  const barW = Math.max(1, slot * (1 - gap))

  const labelIndexes = useMemo(() => pickLabelIndexes(n), [n])

  if (n === 0) {
    return <p className="meta chart-empty">{t('finances.today.emptyChart')}</p>
  }

  return (
    <div className="expense-timeline chart-card">
      {selected ? (
        <div className="expense-timeline-selection" aria-live="polite">
          <strong>{formatAmount(selected.amount)}</strong>
          <span>{shortDateLabel(selected.date)}</span>
        </div>
      ) : null}

      <svg
        className="expense-timeline-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t('finances.today.timelineChart')}
      >
        {yTicks.map((tick) => {
          const y = pad.top + plotH - (tick / yMax) * plotH
          return (
            <g key={tick}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y}
                y2={y}
                className="expense-timeline-grid"
              />
              <text x={pad.left - 6} y={y + 3} textAnchor="end" className="expense-timeline-ylabel">
                {formatYTick(tick)}
              </text>
            </g>
          )
        })}

        {series.map((day, i) => {
          const h = yMax > 0 ? (day.amount / yMax) * plotH : 0
          const x = pad.left + i * slot + (slot - barW) / 2
          const y = pad.top + plotH - h
          const barH = Math.max(h, day.amount > 0 ? 1.5 : 0)
          const isSelected = selectedDate === day.date
          // Invisible hit target for zero/short bars.
          const hitY = pad.top
          const hitH = plotH
          return (
            <g key={day.date}>
              <rect
                x={pad.left + i * slot}
                y={hitY}
                width={slot}
                height={hitH}
                className="expense-timeline-hit"
                onClick={() => setSelectedDate((prev) => (prev === day.date ? null : day.date))}
              />
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                className={`expense-timeline-bar${isSelected ? ' is-selected' : ''}`}
                pointerEvents="none"
              />
            </g>
          )
        })}

        {labelIndexes.map((i) => {
          const day = series[i]
          if (!day) return null
          const x = pad.left + i * slot + slot / 2
          return (
            <text
              key={`x-${day.date}`}
              x={x}
              y={height - 10}
              textAnchor="middle"
              className="expense-timeline-xlabel"
            >
              {xLabel(day.date, n)}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

/** Sparse labels so week dates do not collide. */
function pickLabelIndexes(n: number): number[] {
  if (n <= 1) return [0]
  if (n <= 3) return Array.from({ length: n }, (_, i) => i)
  if (n <= 10) return [0, Math.floor((n - 1) / 2), n - 1]
  if (n <= 16) return [0, Math.floor((n - 1) / 3), Math.floor((2 * (n - 1)) / 3), n - 1]
  const mid = Math.floor((n - 1) / 2)
  const q1 = Math.floor((n - 1) / 4)
  const q3 = Math.floor((3 * (n - 1)) / 4)
  return [...new Set([0, q1, mid, q3, n - 1])].sort((a, b) => a - b)
}

function formatYTick(n: number): string {
  if (n >= 1000) {
    const k = n / 1000
    return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`
  }
  return formatAmount(n)
}
