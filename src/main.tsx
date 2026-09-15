import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App'
import { useSettingsStore } from './store/settingsStore'
import { useAuthStore } from './store/authStore'
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

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
    // Signed out: local defaults only (settings page gated behind auth).
    const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme
    useSettingsStore.setState({ ready: true, theme, language: useSettingsStore.getState().language })
  }, [authReady, user, initSettings])

  if (!authReady || (user && !settingsReady)) return null
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
