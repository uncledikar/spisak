import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type AppLanguage } from '../../i18n'
import { useSettingsStore } from '../store/settingsStore'

const LABELS: Record<AppLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  ru: 'Русский',
  sr: 'Srpski',
}

const FLAGS: Record<AppLanguage, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  ru: '🇷🇺',
  sr: '🇷🇸',
}

export function LanguageSwitcher() {
  const { t } = useTranslation()
  const language = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        className="icon-btn lang-btn"
        onClick={() => setOpen(true)}
        title={t('language.toggle')}
        aria-label={t('language.toggle')}
      >
        <span className="lang-flag" aria-hidden="true">
          {FLAGS[language]}
        </span>
      </button>

      {open
        ? createPortal(
            <div
              className="sheet"
              role="dialog"
              aria-modal="true"
              aria-label={t('language.title')}
              onClick={() => setOpen(false)}
            >
              <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
                <div className="sheet-header">
                  <h2 className="section-title">{t('language.title')}</h2>
                  <button
                    type="button"
                    className="sheet-close"
                    onClick={() => setOpen(false)}
                    aria-label={t('common.cancel')}
                  >
                    ×
                  </button>
                </div>
                <div className="stack">
                  {SUPPORTED_LANGUAGES.map((code) => {
                    const active = code === language
                    return (
                      <button
                        key={code}
                        type="button"
                        className={`btn btn-block lang-option ${active ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => {
                          setOpen(false)
                          void setLanguage(code)
                        }}
                      >
                        <span className="lang-flag" aria-hidden="true">
                          {FLAGS[code]}
                        </span>
                        <span>{LABELS[code]}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
