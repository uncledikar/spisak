import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDisplayDate } from '../utils/dates'
import { DatePickerSheet } from './DatePickerSheet'

type Props = {
  value: string
  onChange: (value: string) => void
  id?: string
  className?: string
  'aria-label'?: string
  title?: string
  required?: boolean
  placeholder?: string
}

/**
 * Cross-platform date control: always shows DD.MM.YYYY and opens the same
 * calendar sheet on tap (avoids native Android/iOS date-input quirks).
 * Value is still YYYY-MM-DD.
 */
export function DateField({
  value,
  onChange,
  id,
  className = '',
  'aria-label': ariaLabel,
  title,
  required = false,
  placeholder,
}: Props) {
  const { t } = useTranslation()
  const autoId = useId()
  const fieldId = id ?? autoId
  const [open, setOpen] = useState(false)
  const label = ariaLabel ?? title ?? t('period.date')
  const display = value ? formatDisplayDate(value) : (placeholder ?? t('period.datePlaceholder'))

  return (
    <>
      <button
        type="button"
        id={fieldId}
        className={`date-field${className ? ` ${className}` : ''}${!value ? ' is-empty' : ''}`}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-required={required || undefined}
        onClick={() => setOpen(true)}
      >
        <span className="date-field-value">{display}</span>
        <span className="date-field-icon" aria-hidden="true">
          ▾
        </span>
      </button>
      <DatePickerSheet
        open={open}
        value={value}
        title={title ?? label}
        onChange={onChange}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
