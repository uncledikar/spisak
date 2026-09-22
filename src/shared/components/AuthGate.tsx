import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'

export function AuthGate() {
  const { t } = useTranslation()
  const toggleTheme = useSettingsStore((s) => s.toggleTheme)
  const theme = useSettingsStore((s) => s.theme)
  const busy = useAuthStore((s) => s.busy)
  const error = useAuthStore((s) => s.error)
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)
  const clearError = useAuthStore((s) => s.clearError)

  return (
    <div className="app-shell auth-gate">
      <header className="app-header">
        <div className="app-header-bar">
          <span className="app-header-brand">{t('app.name')}</span>
          <div className="app-header-actions">
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
      </header>

      <div className="auth-gate-body">
        <p className="auth-gate-tagline">{t('app.tagline')}</p>
        <p className="meta">{t('auth.required')}</p>
        {error ? (
          <div className="offline-banner auth-error-banner" role="alert">
            <span>{error}</span>
            <button type="button" className="sheet-close" onClick={clearError} aria-label={t('common.cancel')}>
              ×
            </button>
          </div>
        ) : null}
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={busy}
          onClick={() => void signInWithGoogle()}
        >
          {t('auth.signInGoogle')}
        </button>
      </div>
    </div>
  )
}
