import { useEffect, useState } from 'react'

interface Props {
  value: number
  onChange: (value: number) => void
  'aria-label'?: string
  className?: string
}

/** Number input that selects all on focus for easy replace. */
export function QtyInput({
  value,
  onChange,
  'aria-label': ariaLabel,
  className = 'qty-input',
}: Props) {
  const safeValue = Number.isFinite(value) && value > 0 ? value : 1
  const [text, setText] = useState(String(safeValue))

  useEffect(() => {
    setText(String(safeValue))
  }, [safeValue])

  return (
    <input
      className={className}
      type="number"
      min={1}
      inputMode="numeric"
      value={text}
      aria-label={ariaLabel}
      onPointerDown={(e) => e.stopPropagation()}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const next = e.target.value
        setText(next)
        const n = Number(next)
        if (next !== '' && Number.isFinite(n) && n > 0) onChange(n)
      }}
      onBlur={() => {
        const n = Number(text)
        const next = Number.isFinite(n) && n > 0 ? Math.floor(n) : 1
        setText(String(next))
        if (next !== safeValue) onChange(next)
      }}
    />
  )
}
