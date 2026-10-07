import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getTrashLists, purgeList, restoreList } from '../api/lists'
import { useLiveData } from '../../../shared/hooks/useLiveData'
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog'
import { PageShell } from '../components/AppHeader'

export function TrashPage() {
  const { t } = useTranslation()
  const lists = useLiveData(() => getTrashLists(), [])
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmSingleId, setConfirmSingleId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const selectedCount = selectedIds.size
  const hasLists = Boolean(lists && lists.length > 0)
  const allSelected = Boolean(lists && lists.length > 0 && lists.every((list) => selectedIds.has(list.id)))
  const markLabel = selectMode ? t('lists.doneMarking') : t('lists.mark')

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

  function toggleSelectAll() {
    if (!lists || lists.length === 0) return
    const allSelected = lists.every((list) => selectedIds.has(list.id))
    setSelectMode(true)
    setSelectedIds(allSelected ? new Set() : new Set(lists.map((list) => list.id)))
  }

  async function purgeSelected() {
    if (busy || selectedCount === 0) return
    setBusy(true)
    try {
      await Promise.all([...selectedIds].map((id) => purgeList(id)))
      setSelectedIds(new Set())
      setSelectMode(false)
      setConfirmOpen(false)
    } finally {
      setBusy(false)
    }
  }

  async function purgeOne(id: string) {
    if (busy) return
    setBusy(true)
    try {
      await purgeList(id)
      setConfirmSingleId(null)
    } finally {
      setBusy(false)
    }
  }

  const pageActions = useMemo(() => {
    if (!hasLists) return null
    return (
      <>
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
        <button
          type="button"
          className={`page-action-link${allSelected ? ' is-active' : ''}`}
          onClick={toggleSelectAll}
        >
          {t('lists.selectAll')}
        </button>
      </>
    )
  }, [hasLists, selectMode, markLabel, allSelected, t])

  return (
    <PageShell crumbs={[{ label: t('trash.title') }]} pageActions={pageActions}>
      {!lists ? (
        <p className="meta">{t('common.loading')}</p>
      ) : lists.length === 0 ? (
        <div className="empty">
          <h2>{t('trash.empty')}</h2>
        </div>
      ) : (
        <div className="stack">
          {lists.map((list) => {
            const selected = selectedIds.has(list.id)
            return (
              <div
                key={list.id}
                className={`card trash-card${selected ? ' list-card-selected' : ''}`}
                onClick={selectMode ? () => toggleSelect(list.id) : undefined}
                role={selectMode ? 'button' : undefined}
                tabIndex={selectMode ? 0 : undefined}
                onKeyDown={
                  selectMode
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleSelect(list.id)
                        }
                      }
                    : undefined
                }
              >
                <div className="list-card-title-row">
                  {selectMode ? (
                    <input
                      type="checkbox"
                      className="list-select-check"
                      checked={selected}
                      onChange={() => toggleSelect(list.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={t('lists.markList', { name: list.name })}
                    />
                  ) : null}
                  <h2 className="card-title">{list.name}</h2>
                </div>
                <p className="meta" style={{ marginBottom: selectMode ? 0 : 12 }}>
                  {t('lists.itemsCount', { count: list.items.length })}
                </p>
                {!selectMode ? (
                  <div className="btn-row" style={{ marginTop: 0 }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => void restoreList(list.id)}
                    >
                      {t('trash.restore')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => setConfirmSingleId(list.id)}
                    >
                      {t('trash.purge')}
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      {selectMode && selectedCount > 0 ? (
        <div className="fab-stack">
          <button type="button" className="fab fab-danger" onClick={() => setConfirmOpen(true)}>
            {t('trash.purge')}
          </button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title={t('trash.purgeSelectedConfirm', { count: selectedCount })}
        confirmLabel={t('trash.purge')}
        danger
        busy={busy}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void purgeSelected()}
      />

      <ConfirmDialog
        open={Boolean(confirmSingleId)}
        title={t('trash.purgeConfirm')}
        confirmLabel={t('trash.purge')}
        danger
        busy={busy}
        onCancel={() => setConfirmSingleId(null)}
        onConfirm={() => {
          if (confirmSingleId) void purgeOne(confirmSingleId)
        }}
      />
    </PageShell>
  )
}
