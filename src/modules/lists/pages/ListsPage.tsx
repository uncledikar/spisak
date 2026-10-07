import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageShell } from '../components/AppHeader'
import { SortableListsList } from '../components/SortableListsList'
import { getActiveLists, softDeleteList } from '../api/lists'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'
import { useAuthStore } from '../../../shared/store/authStore'
import { useLiveData } from '../../../shared/hooks/useLiveData'

export function ListsPage() {
  const { t } = useTranslation()
  const lists = useLiveData(() => getActiveLists(), [])
  const authError = useAuthStore((s) => s.error)
  const clearAuthError = useAuthStore((s) => s.clearError)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const selectedCount = selectedIds.size

  function toggleSelectMode() {
    setSelectMode((prev) => {
      if (prev) setSelectedIds(new Set())
      return !prev
    })
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function deleteSelected() {
    if (busy || selectedCount === 0) return
    setBusy(true)
    try {
      await Promise.all([...selectedIds].map((id) => softDeleteList(id)))
      setSelectedIds(new Set())
      setSelectMode(false)
      setConfirmOpen(false)
    } finally {
      setBusy(false)
    }
  }

  const hasLists = Boolean(lists && lists.length > 0)
  const markLabel = selectMode ? t('lists.doneMarking') : t('lists.mark')

  const pageActions = useMemo(() => {
    if (!hasLists) return null
    return (
      <button
        type="button"
        className={`page-action-link${selectMode ? ' is-active' : ''}`}
        onClick={toggleSelectMode}
      >
        <span className="page-action-check" aria-hidden="true">
          {selectMode ? '☑' : '☐'}
        </span>
        {markLabel}
      </button>
    )
  }, [hasLists, selectMode, markLabel])

  return (
    <PageShell crumbs={[{ label: t('lists.title') }]} pageActions={pageActions}>
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
        <SortableListsList
          lists={lists}
          selectMode={selectMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      )}

      <div className="fab-stack">
        {selectMode && selectedCount > 0 ? (
          <button type="button" className="fab fab-danger" onClick={() => setConfirmOpen(true)}>
            {t('lists.deleteSelected')}
          </button>
        ) : null}
        <Link className="fab" to="/lists/new">
          + {t('lists.new')}
        </Link>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={t('lists.deleteSelectedConfirm', { count: selectedCount })}
        confirmLabel={t('lists.deleteSelected')}
        danger
        busy={busy}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void deleteSelected()}
      />
    </PageShell>
  )
}
