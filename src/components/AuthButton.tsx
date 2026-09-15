import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'

function displayName(email: string | undefined, fullName: string | undefined): string {
  if (fullName?.trim()) return fullName.trim()
  if (email) return email
  return '—'
}

function initials(label: string): string {
  const parts = label.split(/[\s@._-]+/).filter(Boolean)
  const a = parts[0]?.[0] ?? '?'
  const b = parts[1]?.[0] ?? ''
  return (a + b).toUpperCase()
}

export function AuthButton() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const busy = useAuthStore((s) => s.busy)
  const error = useAuthStore((s) => s.error)
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)
  const signOut = useAuthStore((s) => s.signOut)
  const clearError = useAuthStore((s) => s.clearError)
  const [open, setOpen] = useState(false)

  const meta = user?.user_metadata as
    | { full_name?: string; name?: string; avatar_url?: string; picture?: string }
    | undefined
  const name = displayName(user?.email, meta?.full_name ?? meta?.name)
  const avatarUrl = meta?.avatar_url ?? meta?.picture

  if (!user) {
    return (
      <button
        type="button"
        className="icon-btn auth-btn"
        disabled={busy}
        onClick={() => void signInWithGoogle()}
        title={t('auth.signInGoogle')}
        aria-label={t('auth.signInGoogle')}
      >
        G
      </button>
    )
  }

  return (
    <>
      <button
        type="button"
        className="icon-btn auth-btn auth-avatar-btn"
        onClick={() => setOpen(true)}
        title={t('auth.account')}
        aria-label={t('auth.account')}
      >
        {avatarUrl ? (
          <img className="auth-avatar" src={avatarUrl} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="auth-initials">{initials(name)}</span>
        )}
      </button>

      {open ? (
        <div
          className="sheet"
          role="dialog"
          aria-label={t('auth.account')}
          onClick={() => {
            setOpen(false)
            clearError()
          }}
        >
          <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-header">
              <h2 className="section-title">{t('auth.account')}</h2>
              <button
                type="button"
                className="sheet-close"
                onClick={() => {
                  setOpen(false)
                  clearError()
                }}
                aria-label={t('common.cancel')}
              >
                ×
              </button>
            </div>
            <div className="auth-profile">
              {avatarUrl ? (
                <img className="auth-avatar auth-avatar-lg" src={avatarUrl} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className="auth-initials auth-initials-lg">{initials(name)}</span>
              )}
              <div>
                <p className="auth-name">{name}</p>
                {user.email && name !== user.email ? <p className="meta">{user.email}</p> : null}
              </div>
            </div>
            {error ? (
              <p className="auth-error-inline" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              className="btn btn-block btn-secondary"
              disabled={busy}
              onClick={() => {
                void signOut().then(() => setOpen(false))
              }}
            >
              {t('auth.signOut')}
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
