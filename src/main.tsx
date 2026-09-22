import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App'
import { useSettingsStore } from './shared/store/settingsStore'
import { useAuthStore } from './shared/store/authStore'

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  const swUrl = `${import.meta.env.BASE_URL}sw.js`
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(swUrl).then((registration) => {
      const ping = () => {
        void registration.update()
      }
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') ping()
      })
      window.setInterval(ping, 60 * 60 * 1000)
    })
  })
}

registerServiceWorker()

function Root() {
  const initSettings = useSettingsStore((s) => s.init)
  const settingsReady = useSettingsStore((s) => s.ready)
  const initAuth = useAuthStore((s) => s.init)
  const authReady = useAuthStore((s) => s.ready)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    void initAuth()
  }, [initAuth])

  useEffect(() => {
    if (!authReady) return
    if (user) {
      void initSettings()
      return
    }
    // Signed out: keep bootstrapped local prefs (language chosen on AuthGate survives OAuth).
    useSettingsStore.setState({ ready: true })
  }, [authReady, user, initSettings])

  if (!authReady || (user && !settingsReady)) return null
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
