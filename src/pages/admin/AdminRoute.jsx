import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

export default function AdminRoute({ children }) {
  const { isAuthenticated, isViewer } = useAdminAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  // Viewers are restricted to Report (/admin/report) and Survey Data (/admin/data)
  if (isViewer) {
    const path = location.pathname
    if (path === '/admin' || path === '/admin/' || path === '/admin/dimensions') {
      return <Navigate to="/admin/report" replace />
    }
  }

  return children
}
