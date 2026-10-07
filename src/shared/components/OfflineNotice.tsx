import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

const SEEN_KEY = 'spisak.offlineNoticeSeen'

/** One dismissible warning when the app opens while offline. Does not block the UI after close. */
export function OfflineNotice() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (navigator.onLine) {
      try {
        sessionStorage.removeItem(SEEN_KEY)
      } catch {
        /* ignore */
      }
      return
    }
    try {
      if (sessionStorage.getItem(SEEN_KEY) === '1') return
    } catch {
      /* ignore */
    }
    setOpen(true)
  }, [])

  function dismiss() {
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* ignore */
    }
    setOpen(false)
  }

  if (!open) return null

  return createPortal(
    <div className="sheet" role="dialog" aria-modal="true" aria-label={t('common.offlineTitle')} onClick={dismiss}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2 className="section-title">{t('common.offlineTitle')}</h2>
          <button type="button" className="sheet-close" onClick={dismiss} aria-label={t('common.cancel')}>
            ×
          </button>
        </div>
        <p className="meta" style={{ margin: 0 }}>
          {t('common.offlineBody')}
        </p>
        <button type="button" className="btn btn-primary btn-block" onClick={dismiss}>
          {t('common.ok')}
        </button>
      </div>
    </div>,
    document.body,
  )
}
