import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { getTrashLists, purgeList, restoreList } from '../db/lists'

export function TrashPage() {
  const { t } = useTranslation()
  const lists = useLiveQuery(() => getTrashLists(), [])

  async function onPurge(id: string) {
    if (!window.confirm(t('trash.purgeConfirm'))) return
    await purgeList(id)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="icon-btn" to="/" aria-label={t('nav.back')}>
          ←
        </Link>
        <h1>{t('trash.title')}</h1>
      </header>

      <p className="meta" style={{ marginBottom: 16 }}>
        {t('trash.hint')}
      </p>

      {!lists ? (
        <p className="meta">{t('common.loading')}</p>
      ) : lists.length === 0 ? (
        <div className="empty">
          <h2>{t('trash.empty')}</h2>
        </div>
      ) : (
        <div className="stack">
          {lists.map((list) => (
            <div key={list.id} className="card">
              <h2 className="card-title">{list.name}</h2>
              <p className="meta" style={{ marginBottom: 12 }}>
                {t('lists.itemsCount', { count: list.items.length })}
              </p>
              <div className="row" style={{ gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => void restoreList(list.id)}
                >
                  {t('trash.restore')}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => void onPurge(list.id)}
                >
                  {t('trash.purge')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
