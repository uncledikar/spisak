import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MODULE_HOME, writeActiveModule, type AppModule } from './modules'

type Props = {
  open: boolean
  onClose: () => void
}

const MODULES: AppModule[] = ['lists', 'finances', 'medicine']

export function ModuleDrawer({ open, onClose }: Props) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div className={`module-drawer-root${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <button type="button" className="module-drawer-backdrop" aria-label={t('common.cancel')} onClick={onClose} />
      <aside className="module-drawer" role="dialog" aria-modal="true" aria-label={t('nav.modules')}>
        <div className="module-drawer-header">
          <div className="module-drawer-brand">
            <strong>{t('app.name')}</strong>
            <p className="meta">{t('app.tagline')}</p>
          </div>
          <button type="button" className="sheet-close" onClick={onClose} aria-label={t('common.cancel')}>
            ×
          </button>
        </div>
        <nav className="module-drawer-nav">
          {MODULES.map((mod) => (
            <NavLink
              key={mod}
              to={MODULE_HOME[mod]}
              className={({ isActive }) => `module-drawer-link${isActive ? ' is-active' : ''}`}
              onClick={() => {
                writeActiveModule(mod)
                onClose()
              }}
            >
              {t(`nav.module.${mod}`)}
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  )
}
