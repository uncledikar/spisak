import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Category } from '../types/models'

const ICON_CHOICES = ['💳', '🛒', '🏠', '🚗', '🍔', '☕', '💊', '👕', '🎮', '✈️', '📱', '💡', '🎁', '📚', '🔧', '🐶']

type Props = {
  open: boolean
  category: Category | null
  onClose: () => void
  onSave: (input: { name: string; icon: string }) => Promise<void>
}

export function CategoryEditModal({ open, category, onClose, onSave }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(ICON_CHOICES[0])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(category?.name ?? '')
    setIcon(category?.icon ?? ICON_CHOICES[0])
  }, [open, category])

  if (!open) return null

  return (
    <div
      className="sheet"
      role="dialog"
      aria-label={category ? t('finances.categories.edit') : t('finances.categories.new')}
      onClick={onClose}
    >
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2 className="section-title">{category ? t('finances.categories.edit') : t('finances.categories.new')}</h2>
          <button type="button" className="sheet-close" onClick={onClose} aria-label={t('common.cancel')}>
            ×
          </button>
        </div>

        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim() || busy) return
            setBusy(true)
            void onSave({ name: name.trim(), icon })
              .then(onClose)
              .finally(() => setBusy(false))
          }}
        >
          <label className="field">
            <span>{t('finances.categories.name')}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          </label>

          <fieldset className="icon-picker">
            <legend>{t('finances.categories.icon')}</legend>
            <div className="icon-picker-grid">
              {ICON_CHOICES.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={`icon-picker-btn${icon === choice ? ' icon-picker-btn-active' : ''}`}
                  onClick={() => setIcon(choice)}
                  aria-label={choice}
                  aria-pressed={icon === choice}
                >
                  {choice}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="row equal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
