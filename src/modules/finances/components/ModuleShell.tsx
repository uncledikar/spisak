import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppChrome } from '../../../shell/AppChrome'
import { useOnline } from '../../../shared/hooks/useOnline'

export type Crumb = {
  label: string
  to?: string
}

type Props = {
  crumbs: Crumb[]
  pageActions?: ReactNode
  children: ReactNode
}

function WalletIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <rect x="3" y="6" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16.5" cy="14.5" r="1.25" fill="currentColor" />
    </svg>
  )
}

export function ModuleShell({ crumbs, pageActions, children }: Props) {
  const { t } = useTranslation()
  const online = useOnline()
  const current = crumbs[crumbs.length - 1]
  const parents = crumbs.slice(0, -1)

  return (
    <div className="app-shell">
      <header className="app-header">
        <AppChrome
          moduleActions={
            <NavLink
              to="/finances/categories"
              className={({ isActive }) => `icon-btn${isActive ? ' icon-btn-active' : ''}`}
              title={t('nav.categories')}
              aria-label={t('nav.categories')}
            >
              <WalletIcon />
            </NavLink>
          }
        />
        <div className="app-header-page">
          <div className="breadcrumbs">
            {parents.length > 0 ? (
              <nav className="breadcrumb-trail" aria-label={t('nav.breadcrumbs')}>
                {parents.map((crumb, index) => (
                  <span key={`${crumb.label}-${index}`} className="breadcrumb-part">
                    {index > 0 ? (
                      <span className="breadcrumb-sep" aria-hidden="true">
                        {' '}
                        /{' '}
                      </span>
                    ) : null}
                    {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span>{crumb.label}</span>}
                  </span>
                ))}
              </nav>
            ) : null}
            <h1 className="page-title">{current?.label ?? t('app.name')}</h1>
          </div>
          {pageActions ? <div className="page-actions">{pageActions}</div> : null}
        </div>
      </header>

      {!online ? (
        <div className="offline-banner" role="status">
          {t('common.offline')}
        </div>
      ) : null}

      {children}
    </div>
  )
}
