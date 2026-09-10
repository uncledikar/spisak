import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { ListsPage } from './pages/ListsPage'
import { NewListPage } from './pages/NewListPage'
import { ListDetailPage } from './pages/ListDetailPage'
import { LinksPage } from './pages/LinksPage'
import { TemplatesPage } from './pages/TemplatesPage'
import { TrashPage } from './pages/TrashPage'

function AppRoutes() {
  const location = useLocation()
  return (
    <RouteErrorBoundary key={location.pathname}>
      <Routes>
        <Route path="/" element={<ListsPage />} />
        <Route path="/lists/new" element={<NewListPage />} />
        <Route path="/lists/:id" element={<ListDetailPage />} />
        <Route path="/lists/:id/links" element={<LinksPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/trash" element={<TrashPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RouteErrorBoundary>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/spisak">
      <AppRoutes />
    </BrowserRouter>
  )
}
