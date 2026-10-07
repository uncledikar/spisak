import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { profileFromUser, readCachedProfile, rememberUserProfile } from '../utils/profileCache'

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
  const [avatarBroken, setAvatarBroken] = useState(false)

  useEffect(() => {
    if (user) rememberUserProfile(user)
  }, [user])

  useEffect(() => {
    setAvatarBroken(false)
  }, [user?.id])

  const cached = user ? readCachedProfile(user.id) : readCachedProfile()
  const live = user ? profileFromUser(user) : null
  const name = displayName(
    live?.email || cached?.email,
    live?.name || cached?.name,
  )
  const avatarUrl = live?.avatarUrl || cached?.avatarUrl || ''

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
        {avatarUrl && !avatarBroken ? (
          <img
            className="auth-avatar"
            src={avatarUrl}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setAvatarBroken(true)}
          />
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
              {avatarUrl && !avatarBroken ? (
                <img
                  className="auth-avatar auth-avatar-lg"
                  src={avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarBroken(true)}
                />
              ) : (
                <span className="auth-initials auth-initials-lg">{initials(name)}</span>
              )}
              <div>
                <p className="auth-name">{name}</p>
                {(live?.email || cached?.email) && name !== (live?.email || cached?.email) ? (
                  <p className="meta">{live?.email || cached?.email}</p>
                ) : null}
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
