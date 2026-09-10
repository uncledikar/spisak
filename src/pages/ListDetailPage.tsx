import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import type { ListItem } from '../db/types'
import {
  emptyItem,
  getLinkedLists,
  getList,
  saveListAsTemplate,
  softDeleteList,
  updateList,
} from '../db/lists'
import { formatDeadline } from '../utils/dates'
import { reindexPositions } from '../utils/positions'
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
  const list = useLiveQuery(() => getList(id), [id])
  const linked = useLiveQuery(() => getLinkedLists(id), [id])

  const [editing, setEditing] = useState(false)
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
      <div className="app-shell">
        <p className="meta">{t('common.loading')}</p>
      </div>
    )
  }

  if (!list || list.deletedAt !== null) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <Link className="icon-btn" to="/" aria-label={t('nav.back')}>
            ←
          </Link>
          <h1>{t('lists.title')}</h1>
        </header>
        <div className="empty">
          <h2>{t('lists.empty')}</h2>
        </div>
      </div>
    )
  }

  const current = list

  async function toggleChecked(itemId: string) {
    const next = current.items.map((item) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item,
    )
    await updateList(current.id, { items: next })
  }

  async function saveListMeta(e: FormEvent) {
    e.preventDefault()
    await updateList(current.id, {
      name,
      deadline: deadline || null,
      trackQuantity,
    })
    setEditing(false)
  }

  async function onSaveTemplate() {
    await saveListAsTemplate(current.id)
    setToast(t('list.savedAsTemplate'))
  }

  async function onDelete() {
    if (!window.confirm(t('list.deleteConfirm'))) return
    await softDeleteList(current.id)
    navigate('/', { replace: true })
  }

  function openNewItem() {
    setItemModal({ mode: 'create', draft: emptyItem(current.items.length) })
  }

  async function reorderItems(next: ListItem[]) {
    await updateList(current.id, { items: next })
  }

  async function saveItem(updated: ListItem) {
    if (itemModal?.mode === 'create') {
      const next = reindexPositions([...current.items, updated])
      await updateList(current.id, { items: next })
      return
    }
    const next = current.items.map((item) => (item.id === updated.id ? updated : item))
    await updateList(current.id, { items: next })
  }

  async function deleteItem(itemId: string) {
    if (!window.confirm(t('list.deleteItemConfirm'))) return
    const next = reindexPositions(current.items.filter((item) => item.id !== itemId))
    await updateList(current.id, { items: next })
    setItemModal(null)
  }

  const modalItem =
    itemModal?.mode === 'edit'
      ? current.items.find((item) => item.id === itemModal.itemId)
      : itemModal?.mode === 'create'
        ? itemModal.draft
        : undefined

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="icon-btn" to="/" aria-label={t('nav.back')}>
          ←
        </Link>
        <h1>{current.name}</h1>
        <div className="topbar-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              if (!editing) {
                setName(current.name)
                setDeadline(current.deadline ?? '')
                setTrackQuantity(current.trackQuantity !== false)
              }
              setEditing((v) => !v)
            }}
            aria-label={editing ? t('list.done') : t('list.edit')}
          >
            {editing ? '✓' : '✎'}
          </button>
        </div>
      </header>

      <p className="meta row" style={{ marginTop: -8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span>
          {current.deadline
            ? `${t('lists.deadline')}: ${formatDeadline(current.deadline, i18n.language)}`
            : t('lists.noDeadline')}
        </span>
        <ProgressBadge done={progress.done} total={progress.total} />
      </p>

      {editing ? (
        <form onSubmit={(e) => void saveListMeta(e)}>
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

          <div className="field">
            <span className="field-label">{t('list.links')}</span>
            {linked && linked.length > 0 ? (
              <div className="stack" style={{ marginBottom: 8 }}>
                {linked.map((l) => (
                  <Link key={l.id} to={`/lists/${l.id}`} className="card card-button">
                    <h3 className="card-title">{l.name}</h3>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="meta">{t('list.noLinks')}</p>
            )}
            <Link className="btn btn-secondary btn-block" to={`/lists/${current.id}/links`}>
              {t('list.manageLinks')}
            </Link>
          </div>

          <div className="actions-bar">
            <button type="submit" className="btn btn-primary btn-block">
              {t('list.save')}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => setEditing(false)}
            >
              {t('common.cancel')}
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

          {linked && linked.length > 0 ? (
            <>
              <h2 className="section-title section-title-links">{t('list.links')}</h2>
              <div className="stack" style={{ marginBottom: 12 }}>
                {linked.map((l) => (
                  <Link key={l.id} to={`/lists/${l.id}`} className="card card-button">
                    <h3 className="card-title">{l.name}</h3>
                  </Link>
                ))}
              </div>
            </>
          ) : null}

          <div className="actions-bar actions-bar-inline">
            <Link className="btn btn-secondary btn-block" to={`/lists/${current.id}/links`}>
              {t('list.manageLinks')}
            </Link>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => void onSaveTemplate()}>
              {t('list.saveAsTemplate')}
            </button>
            <button type="button" className="btn btn-danger btn-block" onClick={() => void onDelete()}>
              {t('list.delete')}
            </button>
          </div>
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
    </div>
  )
}
