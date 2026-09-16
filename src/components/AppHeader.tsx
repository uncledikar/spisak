import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthButton } from './AuthButton'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useSettingsStore } from '../store/settingsStore'

export type Crumb = {
  label: string
  to?: string
}

type Props = {
  crumbs: Crumb[]
  pageActions?: ReactNode
  children?: ReactNode
}

export function AppHeader({ crumbs, pageActions }: Omit<Props, 'children'>) {
  const { t } = useTranslation()
  const toggleTheme = useSettingsStore((s) => s.toggleTheme)
  const theme = useSettingsStore((s) => s.theme)

  const current = crumbs[crumbs.length - 1]
  const parents = crumbs.slice(0, -1)

  return (
    <header className="app-header">
      <div className="app-header-bar">
        <AuthButton />
        <Link to="/" className="app-header-brand" title={t('app.name')}>
          {t('app.name')}
        </Link>
        <div className="app-header-actions">
          <Link className="icon-btn" to="/trash" title={t('nav.trash')} aria-label={t('nav.trash')}>
            🗑
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
      </div>

      <div className="app-header-page">
        <div className="breadcrumbs">
          {parents.length > 0 ? (
            <nav className="breadcrumb-trail" aria-label={t('nav.breadcrumbs')}>
              {parents.map((crumb, index) => (
                <span key={`${crumb.label}-${index}`} className="breadcrumb-part">
                  {index > 0 ? <span className="breadcrumb-sep" aria-hidden="true"> / </span> : null}
                  {crumb.to ? (
                    <Link to={crumb.to}>{crumb.label}</Link>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          ) : null}
          <h1 className="page-title">{current?.label ?? t('app.name')}</h1>
        </div>
        {pageActions ? <div className="page-actions">{pageActions}</div> : null}
      </div>
    </header>
  )
}

export function PageShell({ crumbs, pageActions, children }: Props) {
  return (
    <div className="app-shell">
      <AppHeader crumbs={crumbs} pageActions={pageActions} />
      {children}
    </div>
  )
}
