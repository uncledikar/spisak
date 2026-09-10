import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type AppLanguage } from '../i18n'
import { useSettingsStore } from '../store/settingsStore'

const LABELS: Record<AppLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  ru: 'Русский',
  sr: 'Srpski',
}

export function LanguageSwitcher() {
  const { t } = useTranslation()
  const language = useSettingsStore((s) => s.language)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="icon-btn lang-btn"
        onClick={() => setOpen(true)}
        title={t('language.toggle')}
        aria-label={t('language.toggle')}
      >
        {language.toUpperCase()}
      </button>

      {open ? (
        <div className="sheet" role="dialog" aria-label={t('language.title')} onClick={() => setOpen(false)}>
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
                    className={`btn btn-block ${active ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      void setLanguage(code)
                      setOpen(false)
                    }}
                  >
                    {LABELS[code]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
