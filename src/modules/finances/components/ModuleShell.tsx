import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppChrome } from '../../../shell/AppChrome'
import { useOnline } from '../../../shared/hooks/useOnline'

type Props = {
  title: string
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

export function ModuleShell({ title, pageActions, children }: Props) {
  const { t } = useTranslation()
  const online = useOnline()

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
          <h1 className="page-title">{title}</h1>
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
