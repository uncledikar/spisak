import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { progressPercent } from '../utils/progress'

interface Props {
  done: number
  total: number
  variant?: 'plain' | 'chip'
  className?: string
}

function AchievementIcon() {
  return (
    <svg
      className="achievement-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden
    >
      <path fill="currentColor" d="M8.2 13.5 5.8 22l4.4-2.2 1.8-6.1z" opacity="0.85" />
      <path fill="currentColor" d="M15.8 13.5 18.2 22l-4.4-2.2-1.8-6.1z" opacity="0.85" />
      <circle cx="12" cy="9.2" r="6.4" fill="currentColor" />
      <circle cx="12" cy="9.2" r="4.6" fill="var(--surface)" opacity="0.35" />
      <path
        fill="var(--surface)"
        d="M12 5.4 13.1 8.2l3 .3-2.3 2.1.7 2.9L12 12.1 9.5 13.5l.7-2.9-2.3-2.1 3-.3z"
        opacity="0.95"
      />
    </svg>
  )
}

function BatteryIcon({ pct }: { pct: number }) {
  const clipId = useId().replace(/:/g, '')
  const fillWidth = (pct / 100) * 16

  return (
    <span className="battery-slot">
      <svg viewBox="0 0 24 12" width="24" height="12" aria-hidden focusable="false">
        <defs>
          <clipPath id={clipId}>
            <rect x="3" y="3" width={fillWidth} height="6" />
          </clipPath>
        </defs>
        <rect
          x="1"
          y="1"
          width="19"
          height="10"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <rect x="21" y="3.5" width="2" height="5" rx="0.6" fill="currentColor" />
        {/* Always in DOM so SVG bbox stable at 0% */}
        <rect
          x="3"
          y="3"
          width="16"
          height="6"
          rx="1"
          fill="currentColor"
          clipPath={`url(#${clipId})`}
        />
      </svg>
    </span>
  )
}

export function ProgressBadge({
  done,
  total,
  variant = 'plain',
  className = '',
}: Props) {
  const { t } = useTranslation()
  const pct = progressPercent(done, total)
  const complete = pct === 100 && total > 0

  return (
    <span
      className={[
        'progress-badge',
        variant === 'chip' ? 'progress-chip' : '',
        complete ? 'complete' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <BatteryIcon pct={pct} />
      <span className="progress-count">{t('lists.checkedCount', { done, total })}</span>
      <span className="progress-pct">{pct}%</span>
      {complete ? <AchievementIcon /> : null}
    </span>
  )
}
