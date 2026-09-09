import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import {
  getActiveLists,
  getLinkedListIds,
  getList,
  linkLists,
  unlinkLists,
} from '../db/lists'

export function LinksPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const list = useLiveQuery(() => getList(id), [id])
  const all = useLiveQuery(() => getActiveLists(), [])
  const linkedIds = useLiveQuery(() => getLinkedListIds(id), [id])

  const linkedSet = new Set(linkedIds ?? [])
  const others = (all ?? []).filter((l) => l.id !== id)

  if (!list || list.deletedAt !== null) {
    return (
      <div className="app-shell">
        <p className="meta">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="icon-btn" to={`/lists/${id}`} aria-label={t('nav.back')}>
          ←
        </Link>
        <h1>{t('links.title')}</h1>
      </header>

      <p className="meta" style={{ marginBottom: 16 }}>
        {t('links.hint')}
      </p>

      {others.length === 0 ? (
        <div className="empty">
          <h2>{t('links.empty')}</h2>
        </div>
      ) : (
        <div className="stack">
          {others.map((other) => {
            const linked = linkedSet.has(other.id)
            return (
              <div key={other.id} className="card row-between">
                <div>
                  <h2 className="card-title">{other.name}</h2>
                  <p className="meta">
                    {linked ? t('links.linked') : t('lists.itemsCount', { count: other.items.length })}
                  </p>
                </div>
                <button
                  type="button"
                  className={`btn ${linked ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() =>
                    void (linked ? unlinkLists(id, other.id) : linkLists(id, other.id))
                  }
                >
                  {linked ? t('links.unlink') : t('links.link')}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
