import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthGate } from './shared/components/AuthGate'
import { RouteErrorBoundary } from './shared/components/RouteErrorBoundary'
import { useAuthStore } from './shared/store/authStore'
import { ListsPage } from './modules/lists/pages/ListsPage'
import { NewListPage } from './modules/lists/pages/NewListPage'
import { ListDetailPage } from './modules/lists/pages/ListDetailPage'
import { TrashPage } from './modules/lists/pages/TrashPage'
import { TodayPage as MedicineTodayPage } from './modules/medicine/pages/TodayPage'
import { MedicinesPage } from './modules/medicine/pages/MedicinesPage'
import { TodayPage as FinancesTodayPage } from './modules/finances/pages/TodayPage'
import { CategoriesPage } from './modules/finances/pages/CategoriesPage'
import { MODULE_HOME, moduleFromPath, readActiveModule, writeActiveModule } from './shell/modules'
import { startSyncListeners as startMedicineSync } from './modules/medicine/api/syncQueue'
import { startSyncListeners as startFinancesSync } from './modules/finances/api/syncQueue'
import { hydrateEntityCache as hydrateMedicineCache } from './modules/medicine/api/entityCache'
import { hydrateEntityCache as hydrateFinancesCache } from './modules/finances/api/entityCache'

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
