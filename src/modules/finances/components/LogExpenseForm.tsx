import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { logExpense } from '../api/expenses'
import type { Category } from '../types/models'
import { todayKey } from '../utils/periods'

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
        if (!categoryId || busy) return
        const value = Number(amount)
        if (!Number.isFinite(value) || value <= 0) return
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

      <div className="category-chips" role="listbox" aria-label={t('finances.today.selectCategory')}>
        {categories.map((c) => {
          const selected = categoryId === c.id
          return (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={selected}
              className={`category-chip${selected ? ' category-chip-active' : ''}`}
              onClick={() => setCategoryId(c.id)}
            >
              <span className="category-chip-icon" aria-hidden="true">
                {c.icon}
              </span>
              <span className="category-chip-name">{c.name}</span>
            </button>
          )
        })}
      </div>

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
          <input type="date" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} required />
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

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={busy || !categoryId || !amount}
      >
        {t('finances.today.submit')}
      </button>
    </form>
  )
}
