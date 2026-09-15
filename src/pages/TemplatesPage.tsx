import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createListFromTemplate, deleteTemplate, getTemplates } from '../api/lists'
import { useLiveData } from '../hooks/useLiveData'

export function TemplatesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const templates = useLiveData(() => getTemplates(), [])

  async function startFromTemplate(id: string) {
    const list = await createListFromTemplate(id)
    if (list) navigate(`/lists/${list.id}`)
  }

  async function onDelete(id: string) {
    if (!window.confirm(t('templates.deleteConfirm'))) return
    await deleteTemplate(id)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="icon-btn" to="/" aria-label={t('nav.back')}>
          ←
        </Link>
        <h1>{t('templates.title')}</h1>
      </header>

      {!templates ? (
        <p className="meta">{t('common.loading')}</p>
      ) : templates.length === 0 ? (
        <div className="empty">
          <h2>{t('templates.empty')}</h2>
          <p>{t('templates.emptyHint')}</p>
        </div>
      ) : (
        <div className="stack">
          {templates.map((tpl) => (
            <div key={tpl.id} className="card">
              <h2 className="card-title">{tpl.name}</h2>
              <p className="meta" style={{ marginBottom: 12 }}>
                {t('lists.itemsCount', { count: tpl.items.length })}
              </p>
              <div className="row" style={{ gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => void startFromTemplate(tpl.id)}
                >
                  {t('templates.use')}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void onDelete(tpl.id)}
                >
                  {t('templates.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
