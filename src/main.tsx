import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App'
import { useSettingsStore } from './store/settingsStore'
import { flushSyncQueue } from './db'
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

function Root() {
  const init = useSettingsStore((s) => s.init)
  const ready = useSettingsStore((s) => s.ready)

  useEffect(() => {
    void init()
  }, [init])

  useEffect(() => {
    const onOnline = () => {
      void flushSyncQueue()
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  if (!ready) return null
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
