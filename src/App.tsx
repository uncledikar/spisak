import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthGate } from './shared/components/AuthGate'
import { BootSplash } from './shared/components/BootSplash'
import { RouteErrorBoundary } from './shared/components/RouteErrorBoundary'
import { useAuthStore } from './shared/store/authStore'
import { MODULE_HOME, moduleFromPath, readActiveModule, writeActiveModule } from './shell/modules'
import { startSyncListeners as startMedicineSync } from './modules/medicine/api/syncQueue'
import { startSyncListeners as startFinancesSync } from './modules/finances/api/syncQueue'
import { hydrateEntityCache as hydrateMedicineCache } from './modules/medicine/api/entityCache'
import { hydrateEntityCache as hydrateFinancesCache } from './modules/finances/api/entityCache'

const ListsPage = lazy(() =>
  import('./modules/lists/pages/ListsPage').then((m) => ({ default: m.ListsPage })),
)
const NewListPage = lazy(() =>
  import('./modules/lists/pages/NewListPage').then((m) => ({ default: m.NewListPage })),
)
const ListDetailPage = lazy(() =>
  import('./modules/lists/pages/ListDetailPage').then((m) => ({ default: m.ListDetailPage })),
)
const TrashPage = lazy(() =>
  import('./modules/lists/pages/TrashPage').then((m) => ({ default: m.TrashPage })),
)
const MedicineTodayPage = lazy(() =>
  import('./modules/medicine/pages/TodayPage').then((m) => ({ default: m.TodayPage })),
)
const MedicinesPage = lazy(() =>
  import('./modules/medicine/pages/MedicinesPage').then((m) => ({ default: m.MedicinesPage })),
)
const FinancesTodayPage = lazy(() =>
  import('./modules/finances/pages/TodayPage').then((m) => ({ default: m.TodayPage })),
)
const CategoriesPage = lazy(() =>
  import('./modules/finances/pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage })),
)

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

hydrateMedicineCache()
hydrateFinancesCache()
startMedicineSync()
startFinancesSync()

function HomeRedirect() {
  return <Navigate to={MODULE_HOME[readActiveModule()]} replace />
}

function ModulePathTracker() {
  const location = useLocation()
  useEffect(() => {
    const mod = moduleFromPath(location.pathname)
    if (mod) writeActiveModule(mod)
  }, [location.pathname])
  return null
}

function AppRoutes() {
  const location = useLocation()
  return (
    <RouteErrorBoundary key={location.pathname}>
      <ModulePathTracker />
      <Suspense fallback={<BootSplash />}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/lists" element={<ListsPage />} />
          <Route path="/lists/new" element={<NewListPage />} />
          <Route path="/lists/:id" element={<ListDetailPage />} />
          <Route path="/trash" element={<TrashPage />} />
          <Route path="/medicine" element={<MedicineTodayPage />} />
          <Route path="/medicine/medicines" element={<MedicinesPage />} />
          <Route path="/finances" element={<FinancesTodayPage />} />
          <Route path="/finances/categories" element={<CategoriesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  )
}

export default function App() {
  const user = useAuthStore((s) => s.user)

  if (!user) {
    return <AuthGate />
  }

  return (
    <BrowserRouter basename={basename}>
      <AppRoutes />
    </BrowserRouter>
  )
}
