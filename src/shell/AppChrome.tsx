import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthButton } from '../shared/components/AuthButton'
import { LanguageSwitcher } from '../shared/components/LanguageSwitcher'
import { useSettingsStore } from '../shared/store/settingsStore'
import { ModuleDrawer } from './ModuleDrawer'

type Props = {
  /** Extra icon buttons between leading cluster and language (e.g. trash, medicines). */
  moduleActions?: ReactNode
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function AppChrome({ moduleActions }: Props) {
  const { t } = useTranslation()
  const toggleTheme = useSettingsStore((s) => s.toggleTheme)
  const theme = useSettingsStore((s) => s.theme)
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <div className="app-header-bar">
        <div className="app-header-leading">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setDrawerOpen(true)}
            title={t('nav.modules')}
            aria-label={t('nav.modules')}
          >
            <MenuIcon />
          </button>
          <AuthButton />
        </div>
        <div className="app-header-actions">
          {moduleActions}
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
      <ModuleDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
