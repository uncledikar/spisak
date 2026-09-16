import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ListItem } from '../types/models'
import { createList, emptyItem } from '../api/lists'
import { isItemColorId, type ItemColorId } from '../utils/itemColors'
import { scrollItemIntoView } from '../utils/scroll'
import { reindexPositions } from '../utils/positions'
import { PageShell } from '../components/AppHeader'
import { ItemColorPicker } from '../components/ItemColorPicker'
import { QtyInput } from '../components/QtyInput'

function asColor(value: string | null | undefined): ItemColorId | null {
  return isItemColorId(value) ? value : null
}

export function NewListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [trackQuantity, setTrackQuantity] = useState(true)
  const [items, setItems] = useState<ListItem[]>([emptyItem(0)])

  function updateItem(id: string, patch: Partial<ListItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function removeItem(id: string) {
    setItems((prev) =>
      prev.length <= 1 ? prev : reindexPositions(prev.filter((item) => item.id !== id)),
    )
  }

  function addItem() {
    const item = emptyItem()
    setItems((prev) => reindexPositions([...prev, item]))
    scrollItemIntoView(item.id)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const cleaned = items
      .map((item) => ({
        ...item,
        name: item.name.trim(),
        comment: item.comment.trim(),
        quantity: Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1,
      }))
      .filter((item) => item.name.length > 0)

    const list = await createList({
      name,
      deadline: deadline || null,
      trackQuantity,
      items: cleaned.length > 0 ? cleaned : [],
    })
    navigate(`/lists/${list.id}`, { replace: true })
  }

  return (
    <PageShell
      crumbs={[
        { label: t('lists.title'), to: '/' },
        { label: t('lists.new') },
      ]}
    >
      <form onSubmit={(e) => void onSubmit(e)}>
        <div className="field">
          <label htmlFor="name">{t('list.name')}</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="deadline">{t('list.deadline')}</label>
          <div className="row">
            <input
              id="deadline"
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
          <span className="field-label" id="track-quantity-label">
            {t('list.trackQuantity')}
          </span>
          <div className="choice-row" role="group" aria-labelledby="track-quantity-label">
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
            <div key={item.id} id={`item-editor-${item.id}`} className="item-editor">
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
                  onClick={() => removeItem(item.id)}
                  aria-label={t('list.delete')}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="actions-bar">
          <button type="button" className="btn btn-ghost btn-block" onClick={addItem}>
            + {t('list.addItem')}
          </button>
          <button type="submit" className="btn btn-primary btn-block">
            {t('list.create')}
          </button>
        </div>
      </form>
    </PageShell>
  )
}
