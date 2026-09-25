import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ListItem } from '../types/models'
import {
  copyList,
  emptyItem,
  getList,
  softDeleteList,
  updateList,
} from '../api/lists'
import { useLiveData } from '../../../shared/hooks/useLiveData'
import { formatDeadline } from '../utils/dates'
import { reindexPositions } from '../utils/positions'
import { PageShell } from '../components/AppHeader'
import { ItemEditModal } from '../components/ItemEditModal'
import { ProgressBadge } from '../components/ProgressBadge'
import { SortableItemsList } from '../components/SortableItemsList'
import { useOverflowAddButton } from '../hooks/useOverflowAddButton'

type ItemModal =
  | { mode: 'edit'; itemId: string }
  | { mode: 'create'; draft: ListItem }
  | null

export function ListDetailPage() {
  const { id = '' } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const remote = useLiveData(() => getList(id), [id])
  /** Local mirror so toggle/DnD paint before any network / effect tick. */
  const [list, setList] = useState(remote)
  const listRef = useRef(list)
  listRef.current = list

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copying, setCopying] = useState(false)
  const [name, setName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [trackQuantity, setTrackQuantity] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [itemModal, setItemModal] = useState<ItemModal>(null)

  const { itemsRef, showBottomAdd } = useOverflowAddButton([
    list?.items.length ?? 0,
    list?.trackQuantity,
    editing,
  ])

  useEffect(() => {
    setList(undefined)
  }, [id])

  useEffect(() => {
    if (remote === undefined) return
    setList((prev) => {
      if (prev && remote && prev.id === remote.id && prev.updatedAt > remote.updatedAt) {
        return prev
      }
      return remote
    })
  }, [remote])

  useEffect(() => {
    if (!list) return
    setName(list.name)
    setDeadline(list.deadline ?? '')
    setTrackQuantity(list.trackQuantity !== false)
  }, [list])

  const progress = useMemo(() => {
    if (!list) return { done: 0, total: 0 }
    return {
      done: list.items.filter((i) => i.checked).length,
      total: list.items.length,
    }
  }, [list])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (list === undefined) {
    return (
      <PageShell crumbs={[{ label: t('lists.title'), to: '/lists' }, { label: t('common.loading') }]}>
        <p className="meta">{t('common.loading')}</p>
      </PageShell>
    )
  }

  if (!list || list.deletedAt !== null) {
    return (
      <PageShell crumbs={[{ label: t('lists.title') }]}>
        <div className="empty">
          <h2>{t('lists.empty')}</h2>
        </div>
      </PageShell>
    )
  }

  const current = list

  function applyItems(nextItems: ListItem[]) {
    const base = listRef.current
    if (!base || base.deletedAt !== null) return
    const next = {
      ...base,
      items: reindexPositions(nextItems),
      updatedAt: Date.now(),
    }
    listRef.current = next
    setList(next)
    void updateList(base.id, { items: next.items })
  }

  function toggleChecked(itemId: string) {
    const base = listRef.current
    if (!base || base.deletedAt !== null) return
    applyItems(
      base.items.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item,
      ),
    )
  }

  async function commitListMeta() {
    if (saving) return
    setSaving(true)
    try {
      await updateList(current.id, {
        name,
        deadline: deadline || null,
        trackQuantity,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function saveListMeta(e: FormEvent) {
    e.preventDefault()
    await commitListMeta()
  }

  async function onCopyList() {
    if (copying) return
    setCopying(true)
    try {
      const copied = await copyList(current.id, t('list.copyName', { name: current.name }))
      if (copied) {
        setToast(t('list.copied'))
        navigate(`/lists/${copied.id}`)
      }
    } finally {
      setCopying(false)
    }
  }

  async function onDelete() {
    if (!window.confirm(t('list.deleteConfirm'))) return
    await softDeleteList(current.id)
    navigate('/lists', { replace: true })
  }

  function openNewItem() {
    setItemModal({ mode: 'create', draft: emptyItem(0) })
  }

  function enterEdit() {
    setName(current.name)
    setDeadline(current.deadline ?? '')
    setTrackQuantity(current.trackQuantity !== false)
    setEditing(true)
  }

  function reorderItems(next: ListItem[]) {
    applyItems(next)
  }

  function saveItem(updated: ListItem) {
    if (itemModal?.mode === 'create') {
      applyItems([updated, ...current.items])
      return
    }
    applyItems(current.items.map((item) => (item.id === updated.id ? updated : item)))
  }

  function deleteItem(itemId: string) {
    if (!window.confirm(t('list.deleteItemConfirm'))) return
    applyItems(current.items.filter((item) => item.id !== itemId))
    setItemModal(null)
  }

  const modalItem =
    itemModal?.mode === 'edit'
      ? current.items.find((item) => item.id === itemModal.itemId)
      : itemModal?.mode === 'create'
        ? itemModal.draft
        : undefined

  return (
    <PageShell
      crumbs={[
        { label: t('lists.title'), to: '/lists' },
        { label: current.name },
      ]}
          pageActions={
        <>
          <button
            type="button"
            className="icon-btn icon-btn-accent"
            disabled={saving}
            onClick={() => {
              if (editing) {
                void commitListMeta()
              } else {
                enterEdit()
              }
            }}
            aria-label={editing ? t('list.save') : t('list.edit')}
            title={editing ? t('list.save') : t('list.edit')}
          >
            {editing ? '✓' : '✎'}
          </button>
          {!editing ? (
            <button
              type="button"
              className="icon-btn"
              disabled={copying}
              onClick={() => void onCopyList()}
              aria-label={t('list.copy')}
              title={t('list.copy')}
            >
              ⧉
            </button>
          ) : null}
        </>
      }
    >
      {!editing ? (
        <p className="meta row" style={{ marginTop: -4, marginBottom: 16, flexWrap: 'wrap' }}>
          <span>
            {current.deadline
              ? `${t('lists.deadline')}: ${formatDeadline(current.deadline, i18n.language)}`
              : t('lists.noDeadline')}
          </span>
          <ProgressBadge done={progress.done} total={progress.total} />
        </p>
      ) : null}

      {editing ? (
        <form id="edit-list-form" onSubmit={(e) => void saveListMeta(e)}>
          <div className="field">
            <label htmlFor="edit-name">{t('list.name')}</label>
            <input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="edit-deadline">{t('list.deadline')}</label>
            <div className="row">
              <input
                id="edit-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                style={{ flex: 1 }}
              />
              {deadline ? (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setDeadline('')}
                  aria-label={t('list.clearDeadline')}
                  title={t('list.clearDeadline')}
                >
                  ×
                </button>
              ) : null}
            </div>
          </div>
          <div className="field">
            <span className="field-label" id="edit-track-quantity-label">
              {t('list.trackQuantity')}
            </span>
            <div className="choice-row" role="group" aria-labelledby="edit-track-quantity-label">
              <button
                type="button"
                className={`btn ${trackQuantity ? 'btn-primary' : 'btn-secondary'}`}
                aria-pressed={trackQuantity}
                onClick={() => setTrackQuantity(true)}
              >
                {t('list.trackQuantityOn')}
              </button>
              <button
                type="button"
                className={`btn ${!trackQuantity ? 'btn-primary' : 'btn-secondary'}`}
                aria-pressed={!trackQuantity}
                onClick={() => setTrackQuantity(false)}
              >
                {t('list.trackQuantityOff')}
              </button>
            </div>
            <p className="field-hint">{t('list.trackQuantityHint')}</p>
          </div>

          <div className="btn-row">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {t('list.save')}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => void onDelete()}
              disabled={saving}
            >
              {t('list.delete')}
            </button>
          </div>
        </form>
      ) : (
        <>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            style={{ marginBottom: 12 }}
            onClick={openNewItem}
          >
            + {t('list.addItem')}
          </button>

          {current.items.length === 0 ? (
            <div className="empty">
              <h2>{t('list.emptyItems')}</h2>
            </div>
          ) : (
            <SortableItemsList
              items={current.items}
              trackQuantity={current.trackQuantity !== false}
              onReorder={reorderItems}
              onToggle={toggleChecked}
              onOpenItem={(itemId) => setItemModal({ mode: 'edit', itemId })}
              listRef={itemsRef}
            />
          )}

          {showBottomAdd ? (
            <button
              type="button"
              className="btn btn-ghost btn-block"
              style={{ marginTop: 12 }}
              onClick={openNewItem}
            >
              + {t('list.addItem')}
            </button>
          ) : null}
        </>
      )}

      {modalItem && itemModal ? (
        <ItemEditModal
          item={modalItem}
          trackQuantity={current.trackQuantity !== false}
          isNew={itemModal.mode === 'create'}
          onSave={saveItem}
          onDelete={
            itemModal.mode === 'edit'
              ? () => deleteItem(itemModal.itemId)
              : undefined
          }
          onClose={() => setItemModal(null)}
        />
      ) : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </PageShell>
  )
}
