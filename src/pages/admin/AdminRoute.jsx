import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

export default function AdminRoute({ children }) {
  const { isAuthenticated } = useAdminAuth()
  return isAuthenticated ? children : <Navigate to="/admin/login" replace />
}
