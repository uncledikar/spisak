import { useTranslation } from 'react-i18next'
import type { DateRange, PeriodKind } from '../types/models'
import { formatRangeLabel } from '../utils/periods'
import { commitDateInput } from '../../../shared/utils/dateInput'

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
  const kinds: PeriodKind[] = ['day', 'week', 'month', 'year', 'custom']

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
            <input
              type="date"
              value={custom.start}
              onChange={(e) => commitDateInput(e, (start) => onCustom({ ...custom, start }))}
            />
          </label>
          <label className="field grow">
            <span>{t('period.to')}</span>
            <input
              type="date"
              value={custom.end}
              onChange={(e) => commitDateInput(e, (end) => onCustom({ ...custom, end }))}
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
          {kind === 'day' ? (
            <input
              type="date"
              className="period-anchor"
              value={anchor}
              onChange={(e) => commitDateInput(e, onAnchor)}
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

      <label className="check-row">
        <input type="checkbox" checked={compare} onChange={(e) => onCompare(e.target.checked)} />
        <span>{t('finances.today.compare')}</span>
      </label>
    </div>
  )
}
