import { useTranslation } from 'react-i18next'
import { getTrashLists, purgeList, restoreList } from '../api/lists'
import { useLiveData } from '../../../shared/hooks/useLiveData'
import { PageShell } from '../components/AppHeader'

export function TrashPage() {
  const { t } = useTranslation()
  const lists = useLiveData(() => getTrashLists(), [])

  async function onPurge(id: string) {
    if (!window.confirm(t('trash.purgeConfirm'))) return
    await purgeList(id)
  }

  return (
    <PageShell crumbs={[{ label: t('trash.title') }]}>
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
              <div className="btn-row" style={{ marginTop: 0 }}>
                <button
                  type="button"
                  className="btn btn-primary"
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
    </PageShell>
  )
}
