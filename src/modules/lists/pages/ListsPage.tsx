import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageShell } from '../components/AppHeader'
import { SortableListsList } from '../components/SortableListsList'
import { getActiveLists } from '../api/lists'
import { useAuthStore } from '../../../shared/store/authStore'
import { useLiveData } from '../../../shared/hooks/useLiveData'
import { useOnline } from '../../../shared/hooks/useOnline'

export function ListsPage() {
  const { t } = useTranslation()
  const lists = useLiveData(() => getActiveLists(), [])
  const authError = useAuthStore((s) => s.error)
  const clearAuthError = useAuthStore((s) => s.clearError)
  const online = useOnline()

  return (
    <PageShell crumbs={[{ label: t('lists.title') }]}>
      {!online && <div className="offline-banner">{t('common.offline')}</div>}
      {authError ? (
        <div className="offline-banner auth-error-banner" role="alert">
          <span>{authError}</span>
          <button type="button" className="sheet-close" onClick={clearAuthError} aria-label={t('common.cancel')}>
            ×
          </button>
        </div>
      ) : null}

      {!lists ? (
        <p className="meta">{t('common.loading')}</p>
      ) : lists.length === 0 ? (
        <div className="empty">
          <h2>{t('lists.empty')}</h2>
          <p>{t('lists.emptyHint')}</p>
        </div>
      ) : (
        <SortableListsList lists={lists} />
      )}

      <Link className="fab" to="/lists/new">
        + {t('lists.new')}
      </Link>
    </PageShell>
  )
}
