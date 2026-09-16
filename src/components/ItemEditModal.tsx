import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { ListItem } from '../types/models'
import { isItemColorId, type ItemColorId } from '../utils/itemColors'
import { ItemColorPicker } from './ItemColorPicker'
import { QtyInput } from './QtyInput'

interface Props {
  item: ListItem
  trackQuantity: boolean
  isNew?: boolean
  onSave: (item: ListItem) => void | Promise<void>
  onDelete?: () => void | Promise<void>
  onClose: () => void
}

function asColor(value: string | null | undefined): ItemColorId | null {
  return isItemColorId(value) ? value : null
}

export function ItemEditModal({
  item,
  trackQuantity,
  isNew = false,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState(item.name)
  const [quantity, setQuantity] = useState(item.quantity)
  const [comment, setComment] = useState(item.comment)
  const [color, setColor] = useState<ItemColorId | null>(asColor(item.color))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(item.name)
    setQuantity(item.quantity)
    setComment(item.comment)
    setColor(asColor(item.color))
  }, [item])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      await onSave({
        ...item,
        name: trimmed,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        comment: comment.trim(),
        color,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const title = isNew ? t('list.addItem') : t('list.editItem')

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="sheet-panel item-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2 className="section-title">{title}</h2>
          <button type="button" className="sheet-close" onClick={onClose} aria-label={t('common.cancel')}>
            ×
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="field">
            <label htmlFor="item-modal-name">{t('list.itemName')}</label>
            <input
              id="item-modal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('list.itemName')}
              autoFocus
              required
            />
          </div>

          {trackQuantity ? (
            <div className="field">
              <label htmlFor="item-modal-qty">{t('list.quantity')}</label>
              <QtyInput
                value={quantity}
                onChange={setQuantity}
                aria-label={t('list.quantity')}
              />
            </div>
          ) : null}

          <div className="field">
            <label htmlFor="item-modal-comment">{t('list.comment')}</label>
            <div className="item-modal-meta-row">
              <ItemColorPicker value={color} onChange={setColor} />
              <input
                id="item-modal-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('list.commentPlaceholder')}
              />
            </div>
          </div>

          <div className="btn-row">
            <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
              {t('list.save')}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </button>
            {!isNew && onDelete ? (
              <button
                type="button"
                className="btn btn-danger"
                disabled={saving}
                onClick={() => void onDelete()}
              >
                {t('list.deleteItem')}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  )
}
