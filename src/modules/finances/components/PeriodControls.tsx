import { useTranslation } from 'react-i18next'
import type { DateRange, PeriodKind } from '../types/models'
import { formatRangeLabel } from '../utils/periods'
import { DateField } from '../../../shared/components/DateField'

type Props = {
  kind: PeriodKind
  anchor: string
  custom: DateRange
  compare: boolean
  range: DateRange
  onKind: (kind: PeriodKind) => void
  onAnchor: (anchor: string) => void
  onCustom: (range: DateRange) => void
  onCompare: (value: boolean) => void
  onShift: (direction: -1 | 1) => void
}

export function PeriodControls({
  kind,
  anchor,
  custom,
  compare,
  range,
  onKind,
  onAnchor,
  onCustom,
  onCompare,
  onShift,
}: Props) {
  const { t, i18n } = useTranslation()
  const kinds: PeriodKind[] = ['day', 'week', 'month', 'year', 'custom', 'date']
  const singleDay = kind === 'day' || kind === 'date'
  const canCompare = kind !== 'custom'

  return (
    <div className="period-controls stack">
      <div className="period-kinds">
        {kinds.map((k) => (
          <button
            key={k}
            type="button"
            className={`chip${kind === k ? ' active' : ''}`}
            onClick={() => onKind(k)}
          >
            {t(`period.${k}`)}
          </button>
        ))}
      </div>

      {kind === 'custom' ? (
        <div className="row period-custom">
          <label className="field grow">
            <span>{t('period.from')}</span>
            <DateField
              value={custom.start}
              onChange={(start) => onCustom({ ...custom, start })}
              title={t('period.from')}
            />
          </label>
          <label className="field grow">
            <span>{t('period.to')}</span>
            <DateField
              value={custom.end}
              onChange={(end) => onCustom({ ...custom, end })}
              title={t('period.to')}
            />
          </label>
        </div>
      ) : (
        <div className="period-nav">
          <button
            type="button"
            className="icon-btn period-shift"
            onClick={() => onShift(-1)}
            title={t('period.prev')}
            aria-label={t('period.prev')}
          >
            ‹
          </button>
          {singleDay ? (
            <DateField
              className="period-anchor"
              value={anchor}
              onChange={onAnchor}
              title={t('period.date')}
            />
          ) : (
            <span className="period-label">{formatRangeLabel(range, i18n.language)}</span>
          )}
          <button
            type="button"
            className="icon-btn period-shift"
            onClick={() => onShift(1)}
            title={t('period.next')}
            aria-label={t('period.next')}
          >
            ›
          </button>
        </div>
      )}

      {canCompare ? (
        <label className="check-row">
          <input type="checkbox" checked={compare} onChange={(e) => onCompare(e.target.checked)} />
          <span>{t('finances.today.compare')}</span>
        </label>
      ) : null}
    </div>
  )
}
