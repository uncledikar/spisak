import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { logExpense } from '../api/expenses'
import type { Category } from '../types/models'
import { todayKey } from '../utils/periods'
import { commitDateInput } from '../../../shared/utils/dateInput'

type Props = {
  categories: Category[]
}

export function LogExpenseForm({ categories }: Props) {
  const { t } = useTranslation()
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [spentOn, setSpentOn] = useState(todayKey())
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [categoryError, setCategoryError] = useState(false)

  if (categories.length === 0) {
    return (
      <div className="card log-card">
        <p className="meta">{t('finances.today.noCategories')}</p>
        <Link className="btn btn-primary btn-block" to="/finances/categories">
          {t('finances.categories.add')}
        </Link>
      </div>
    )
  }

  return (
    <form
      className="card log-card stack"
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
          .then(() => {
            setAmount('')
            setComment('')
          })
          .finally(() => setBusy(false))
      }}
    >
      <h2 className="section-title">{t('finances.today.log')}</h2>

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

      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {t('finances.today.submit')}
      </button>
    </form>
  )
}
