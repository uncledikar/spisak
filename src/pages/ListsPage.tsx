import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { ProgressBadge } from '../components/ProgressBadge'
import { getActiveLists } from '../db/lists'
import { useSettingsStore } from '../store/settingsStore'
import { useOnline } from '../hooks/useOnline'
import { formatRelative, formatDeadline } from '../utils/dates'

export function ListsPage() {
  const { t, i18n } = useTranslation()
  const lists = useLiveQuery(() => getActiveLists(), [])
  const toggleTheme = useSettingsStore((s) => s.toggleTheme)
  const theme = useSettingsStore((s) => s.theme)
  const online = useOnline()

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>{t('lists.title')}</h1>
        <div className="topbar-actions">
          <Link className="icon-btn" to="/templates" title={t('nav.templates')} aria-label={t('nav.templates')}>
            ▦
          </Link>
          <Link className="icon-btn" to="/trash" title={t('nav.trash')} aria-label={t('nav.trash')}>
            ⌫
          </Link>
          <LanguageSwitcher />
          <button
            type="button"
            className="icon-btn"
            onClick={() => void toggleTheme()}
            title={t('theme.toggle')}
            aria-label={t('theme.toggle')}
          >
            {theme === 'light' ? '☾' : '☀'}
          </button>
        </div>
      </header>

      {!online && <div className="offline-banner">{t('common.offline')}</div>}

      {!lists ? (
        <p className="meta">{t('common.loading')}</p>
      ) : lists.length === 0 ? (
        <div className="empty">
          <h2>{t('lists.empty')}</h2>
          <p>{t('lists.emptyHint')}</p>
        </div>
      ) : (
        <div className="stack">
          {lists.map((list) => {
            const done = list.items.filter((i) => i.checked).length
            return (
              <Link key={list.id} to={`/lists/${list.id}`} className="card card-button">
                <div className="row-between">
                  <h2 className="card-title">{list.name}</h2>
                  <ProgressBadge done={done} total={list.items.length} variant="chip" />
                </div>
                <p className="meta">
                  {list.deadline
                    ? `${t('lists.deadline')}: ${formatDeadline(list.deadline, i18n.language)}`
                    : t('lists.noDeadline')}
                  {' · '}
                  {t('lists.updated')} {formatRelative(list.updatedAt, i18n.language)}
                </p>
              </Link>
            )
          })}
        </div>
      )}

      <Link className="fab" to="/lists/new">
        + {t('lists.new')}
      </Link>
    </div>
  )
}
