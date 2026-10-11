import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { parseDateKey, toDateKey, todayKey } from '../utils/dates'

type Props = {
  open: boolean
  value: string
  onChange: (value: string) => void
  onClose: () => void
  title?: string
}

function weekdayLabels(locale: string): string[] {
  // 2024-01-01 was a Monday (UTC).
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(Date.UTC(2024, 0, 1 + i))
    return new Intl.DateTimeFormat(locale || undefined, {
      weekday: 'short',
      timeZone: 'UTC',
    }).format(day)
  })
}

export function DatePickerSheet({ open, value, onChange, onClose, title }: Props) {
  const { t, i18n } = useTranslation()
  const selected = parseDateKey(value) ?? parseDateKey(todayKey())!
  const [month, setMonth] = useState(() => startOfMonth(selected))

  useEffect(() => {
    if (!open) return
    const next = parseDateKey(value) ?? parseDateKey(todayKey())
    if (next) setMonth(startOfMonth(next))
  }, [open, value])

  const labels = useMemo(() => weekdayLabels(i18n.language), [i18n.language])
  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language || undefined, {
        month: 'long',
        year: 'numeric',
      }).format(month),
    [month, i18n.language],
  )

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [month])

  if (!open) return null

  return createPortal(
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title ?? t('period.date')} onClick={onClose}>
      <div className="sheet-panel date-picker-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2 className="section-title">{title ?? t('period.date')}</h2>
          <button type="button" className="sheet-close" onClick={onClose} aria-label={t('common.cancel')}>
            ×
          </button>
        </div>

        <div className="date-picker-nav">
          <button
            type="button"
            className="icon-btn period-shift"
            onClick={() => setMonth((m) => startOfMonth(addMonths(m, -1)))}
            aria-label={t('period.prev')}
          >
            ‹
          </button>
          <span className="date-picker-month">{monthLabel}</span>
          <button
            type="button"
            className="icon-btn period-shift"
            onClick={() => setMonth((m) => startOfMonth(addMonths(m, 1)))}
            aria-label={t('period.next')}
          >
            ›
          </button>
        </div>

        <div className="date-picker-weekdays" aria-hidden="true">
          {labels.map((label, index) => (
            <span key={`${label}-${index}`}>{label}</span>
          ))}
        </div>

        <div className="date-picker-grid" role="grid">
          {days.map((day) => {
            const key = toDateKey(day)
            const inMonth = isSameMonth(day, month)
            const isSelected = Boolean(value) && isSameDay(day, selected)
            const isToday = key === todayKey()
            return (
              <button
                key={key}
                type="button"
                role="gridcell"
                className={`date-picker-day${inMonth ? '' : ' is-outside'}${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`}
                onClick={() => {
                  onChange(key)
                  onClose()
                }}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body,
  )
}
