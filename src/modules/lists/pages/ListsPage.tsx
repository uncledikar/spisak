import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageShell } from '../components/AppHeader'
import { ProgressBadge } from '../components/ProgressBadge'
import { getActiveLists } from '../api/lists'
import { useAuthStore } from '../../../shared/store/authStore'
import { useLiveData } from '../../../shared/hooks/useLiveData'
import { useOnline } from '../../../shared/hooks/useOnline'
import { formatRelative, formatDeadline } from '../utils/dates'

export function ListsPage() {
  const { t, i18n } = useTranslation()
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
        <div className="stack">
          {lists.map((list) => {
            const done = list.items.filter((i) => i.checked).length
            return (
              <Link key={list.id} to={`/lists/${list.id}`} className="card card-button">
                <div className="row-between">
                  <h2 className="card-title">{list.name}</h2>
                  <ProgressBadge done={done} total={list.items.length} variant="chip" />
                </div>
                <p className="meta">
                  {list.deadline
                    ? `${t('lists.deadline')}: ${formatDeadline(list.deadline, i18n.language)}`
                    : t('lists.noDeadline')}
                  {' · '}
                  {t('lists.updated')} {formatRelative(list.updatedAt, i18n.language)}
                </p>
              </Link>
            )
          })}
        </div>
      )}

      <Link className="fab" to="/lists/new">
        + {t('lists.new')}
      </Link>
    </PageShell>
  )
}
