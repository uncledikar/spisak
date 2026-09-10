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
import { itemColorValue, isItemColorId, type ItemColorId } from '../utils/itemColors'
import { formatDeadline } from '../utils/dates'
import { scrollItemIntoView } from '../utils/scroll'
import { reindexPositions } from '../utils/positions'
import { ItemColorPicker } from '../components/ItemColorPicker'
import { ProgressBadge } from '../components/ProgressBadge'
import { QtyInput } from '../components/QtyInput'
import { SortableItemsList } from '../components/SortableItemsList'
import { useOverflowAddButton } from '../hooks/useOverflowAddButton'

function asColor(value: string | null | undefined): ItemColorId | null {
  return isItemColorId(value) ? value : null
}

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
  const [items, setItems] = useState<ListItem[]>([])
  const [toast, setToast] = useState<string | null>(null)

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
    setItems(
      list.items.map((item) => ({
        ...item,
        color: item.color ?? null,
        position: item.position ?? 0,
      })),
    )
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

  async function saveEdit(e: FormEvent) {
    e.preventDefault()
    const cleaned = items
      .map((item) => ({
        ...item,
        name: item.name.trim(),
        comment: item.comment.trim(),
        quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1,
      }))
      .filter((item) => item.name.length > 0)

    await updateList(current.id, {
      name,
      deadline: deadline || null,
      trackQuantity,
      items: cleaned,
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

  function updateItem(itemId: string, patch: Partial<ListItem>) {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item)))
  }

  function addItem() {
    const item = emptyItem()
    setItems((prev) => {
      const next = reindexPositions([...prev, item])
      return next
    })
    scrollItemIntoView(item.id)
  }

  async function addItemFromView() {
    const item = emptyItem(current.items.length)
    const next = reindexPositions([...current.items, item])
    setItems(next)
    setEditing(true)
    await updateList(current.id, { items: next })
    scrollItemIntoView(item.id)
  }

  async function reorderItems(next: ListItem[]) {
    await updateList(current.id, { items: next })
  }

  async function changeQuantity(itemId: string, quantity: number) {
    const next = current.items.map((item) =>
      item.id === itemId ? { ...item, quantity } : item,
    )
    await updateList(current.id, { items: next })
  }

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
            onClick={() => setEditing((v) => !v)}
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
        <form onSubmit={(e) => void saveEdit(e)}>
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
          <h2 className="section-title">{t('list.items')}</h2>
          <div className="stack stack-items">
            {items.map((item) => (
              <div
                key={item.id}
                id={`item-editor-${item.id}`}
                className="item-editor"
                style={
                  itemColorValue(item.color)
                    ? { background: itemColorValue(item.color) }
                    : undefined
                }
              >
                <input
                  value={item.name}
                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  placeholder={t('list.itemName')}
                />
                <div className="row">
                  <ItemColorPicker
                    value={asColor(item.color)}
                    onChange={(color) => updateItem(item.id, { color })}
                  />
                  {trackQuantity ? (
                    <QtyInput
                      value={item.quantity}
                      onChange={(quantity) => updateItem(item.id, { quantity })}
                      aria-label={t('list.quantity')}
                    />
                  ) : null}
                  <input
                    style={{ flex: 1 }}
                    value={item.comment}
                    onChange={(e) => updateItem(item.id, { comment: e.target.value })}
                    placeholder={t('list.commentPlaceholder')}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() =>
                      setItems((prev) =>
                        prev.length <= 1
                          ? prev
                          : reindexPositions(prev.filter((x) => x.id !== item.id)),
                      )
                    }
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="actions-bar">
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={addItem}
            >
              + {t('list.addItem')}
            </button>
            <button type="submit" className="btn btn-primary btn-block">
              {t('list.save')}
            </button>
          </div>
        </form>
      ) : (
        <>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            style={{ marginBottom: 12 }}
            onClick={() => void addItemFromView()}
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
              onQuantityChange={changeQuantity}
              listRef={itemsRef}
            />
          )}

          {showBottomAdd ? (
            <button
              type="button"
              className="btn btn-ghost btn-block"
              style={{ marginTop: 12 }}
              onClick={() => void addItemFromView()}
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

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  )
}
