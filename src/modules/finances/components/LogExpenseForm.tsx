import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { logExpense } from '../api/expenses'
import type { Category } from '../types/models'
import { commitDateInput } from '../../../shared/utils/dateInput'

type Props = {
  open: boolean
  onClose: () => void
  categories: Category[]
  defaultDate: string
}

export function LogExpenseForm({ open, onClose, categories, defaultDate }: Props) {
  const { t } = useTranslation()
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [spentOn, setSpentOn] = useState(defaultDate)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [categoryError, setCategoryError] = useState(false)

  useEffect(() => {
    if (!open) return
    setCategoryId('')
    setAmount('')
    setSpentOn(defaultDate)
    setComment('')
    setCategoryError(false)
    setBusy(false)
  }, [open, defaultDate])

  if (!open) return null

  return (
    <div
      className="sheet"
      role="dialog"
      aria-modal="true"
      aria-label={t('finances.today.log')}
      onClick={onClose}
    >
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2 className="section-title">{t('finances.today.log')}</h2>
          <button type="button" className="sheet-close" onClick={onClose} aria-label={t('common.cancel')}>
            ×
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="stack">
            <p className="meta">{t('finances.today.noCategories')}</p>
            <Link className="btn btn-primary btn-block" to="/finances/categories" onClick={onClose}>
              {t('finances.categories.add')}
            </Link>
          </div>
        ) : (
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault()
              if (busy) return
              if (!categoryId) {
                setCategoryError(true)
                return
              }
              const value = Number(amount)
              if (!Number.isFinite(value) || value <= 0) return
              setCategoryError(false)
              setBusy(true)
              void logExpense({
                categoryId,
                amount: value,
                spentOn,
                comment,
              })
                .then(onClose)
                .finally(() => setBusy(false))
            }}
          >
            <label className={`field field-category${categoryError ? ' field-invalid' : ''}`}>
              <span>{t('finances.today.selectCategory')}</span>
              <select
                value={categoryId}
                aria-invalid={categoryError}
                aria-label={t('finances.today.selectCategory')}
                onChange={(e) => {
                  setCategoryId(e.target.value)
                  if (e.target.value) setCategoryError(false)
                }}
              >
                <option value="" disabled>
                  {t('finances.today.selectCategory')}
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
              {categoryError ? (
                <span className="field-error-text">{t('finances.today.categoryRequired')}</span>
              ) : null}
            </label>

            <div className="row log-fields">
              <label className="field field-qty">
                <span>{t('finances.today.amount')}</span>
                <input
                  type="number"
                  min={0.01}
                  step="any"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  required
                />
              </label>
              <label className="field field-date grow">
                <span>{t('finances.today.date')}</span>
                <input
                  type="date"
                  value={spentOn}
                  onChange={(e) => commitDateInput(e, setSpentOn)}
                  required
                />
              </label>
            </div>

            <label className="field">
              <span>{t('finances.today.comment')}</span>
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('finances.today.commentPlaceholder')}
              />
            </label>

            <div className="row equal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {t('finances.today.submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
