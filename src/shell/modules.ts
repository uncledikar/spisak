export type AppModule = 'lists' | 'finances' | 'medicine'

export const MODULE_HOME: Record<AppModule, string> = {
  lists: '/lists',
  finances: '/finances',
  medicine: '/medicine',
}

const STORAGE_KEY = 'myapp.activeModule'

export function readActiveModule(): AppModule {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'lists' || raw === 'finances' || raw === 'medicine') return raw
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
  if (pathname.startsWith('/medicine')) return 'medicine'
  if (pathname.startsWith('/lists') || pathname.startsWith('/trash')) return 'lists'
  return null
}
