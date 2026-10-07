import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

type Props = {
  open: boolean
  title: string
  body?: string
  confirmLabel: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation()
  if (!open) return null

  return createPortal(
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={onCancel}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2 className="section-title">{title}</h2>
          <button type="button" className="sheet-close" onClick={onCancel} aria-label={t('common.cancel')}>
            ×
          </button>
        </div>
        {body ? (
          <p className="meta" style={{ margin: 0 }}>
            {body}
          </p>
        ) : null}
        <div className="row equal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
