import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createList } from '../api/lists'
import { PageShell } from '../components/AppHeader'

export function NewListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [deadline, setDeadline] = useState('')
  const [trackQuantity, setTrackQuantity] = useState(true)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const list = await createList({
      name,
      deadline: deadline || null,
      trackQuantity,
      items: [],
    })
    navigate(`/lists/${list.id}`, { replace: true })
  }

  return (
    <PageShell
      crumbs={[
        { label: t('lists.title'), to: '/lists' },
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

        <div className="actions-bar">
          <button type="submit" className="btn btn-primary btn-block">
            {t('list.create')}
          </button>
        </div>
      </form>
    </PageShell>
  )
}
