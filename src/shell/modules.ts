export type AppModule = 'lists' | 'finances'

export const MODULE_HOME: Record<AppModule, string> = {
  lists: '/lists',
  finances: '/finances',
}

const STORAGE_KEY = 'myapp.activeModule'

/** Client cache left by the removed Medicine module. */
const LEGACY_MEDICINE_KEYS = ['medicine.medicines', 'medicine.consumptions', 'medicine.syncQueue']

function forgetLegacyMedicine(): void {
  try {
    for (const key of LEGACY_MEDICINE_KEYS) localStorage.removeItem(key)
    if (localStorage.getItem(STORAGE_KEY) === 'medicine') {
      localStorage.setItem(STORAGE_KEY, 'lists')
    }
  } catch {
    /* ignore */
  }
}

forgetLegacyMedicine()

export function readActiveModule(): AppModule {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'lists' || raw === 'finances') return raw
  } catch {
    /* ignore */
  }
  return 'lists'
}

export function writeActiveModule(module: AppModule): void {
  localStorage.setItem(STORAGE_KEY, module)
}

export function moduleFromPath(pathname: string): AppModule | null {
  if (pathname.startsWith('/finances')) return 'finances'
  if (pathname.startsWith('/lists') || pathname.startsWith('/trash')) return 'lists'
  return null
}
