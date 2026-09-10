import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ITEM_COLORS, itemTintClass, type ItemColorId } from '../utils/itemColors'

interface Props {
  value: ItemColorId | null
  onChange: (color: ItemColorId | null) => void
}

export function ItemColorPicker({ value, onChange }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const tintClass = itemTintClass(value)

  return (
    <div className="color-picker" ref={rootRef}>
      <button
        type="button"
        className={`color-trigger${value ? ' has-color' : ''}${tintClass ? ` ${tintClass}` : ''}`}
        onClick={() => setOpen((v) => !v)}
        title={t('list.color')}
        aria-label={t('list.color')}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="color-trigger-icon" aria-hidden>
          ◐
        </span>
      </button>

      {open ? (
        <div className="color-palette" role="dialog" aria-label={t('list.color')}>
          <button
            type="button"
            className={`color-swatch color-swatch-none${value === null ? ' active' : ''}`}
            onClick={() => {
              onChange(null)
              setOpen(false)
            }}
            title={t('list.colorNone')}
            aria-label={t('list.colorNone')}
            aria-pressed={value === null}
          />
          {ITEM_COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              className={`color-swatch${value === color.id ? ' active' : ''}`}
              data-color={color.id}
              onClick={() => {
                onChange(color.id)
                setOpen(false)
              }}
              title={t(`list.colors.${color.id}`)}
              aria-label={t(`list.colors.${color.id}`)}
              aria-pressed={value === color.id}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
