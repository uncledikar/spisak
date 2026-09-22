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

function PillIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <rect x="3.5" y="8" width="17" height="8" rx="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 12h8.5" stroke="currentColor" strokeWidth="1.8" opacity="0.35" />
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
              to="/medicine/medicines"
              className={({ isActive }) => `icon-btn${isActive ? ' icon-btn-active' : ''}`}
              title={t('nav.medicines')}
              aria-label={t('nav.medicines')}
            >
              <PillIcon />
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
