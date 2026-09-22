import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import { ITEM_COLORS, itemTintClass, type ItemColorId } from '../utils/itemColors'

interface Props {
  value: ItemColorId | null
  onChange: (color: ItemColorId | null) => void
}

export function ItemColorPicker({ value, onChange }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [palettePos, setPalettePos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setPalettePos(null)
      return
    }
    function place() {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = 168
      const height = 96
      let left = rect.left
      let top = rect.bottom + 8
      if (left + width > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - width - 12)
      }
      if (top + height > window.innerHeight - 12) {
        top = Math.max(12, rect.top - height - 8)
      }
      setPalettePos({ top, left })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      const palette = document.getElementById('item-color-palette')
      if (palette?.contains(target)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopImmediatePropagation()
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  const tintClass = itemTintClass(value)

  const palette =
    open && palettePos
      ? createPortal(
          <div
            id="item-color-palette"
            className="color-palette color-palette-portal"
            role="dialog"
            aria-label={t('list.color')}
            style={{ top: palettePos.top, left: palettePos.left }}
          >
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
          </div>,
          document.body,
        )
      : null

  return (
    <div className="color-picker" ref={rootRef}>
      <button
        ref={triggerRef}
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
      {palette}
    </div>
  )
}
