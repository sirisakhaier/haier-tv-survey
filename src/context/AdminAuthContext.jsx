import { createContext, useContext, useState } from 'react'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('admin_auth') === 'true'
  )
  const [role, setRole] = useState(
    () => sessionStorage.getItem('admin_role') || 'admin'
  )

  const login = async (password) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const json = await res.json()
      if (res.ok && json.ok) {
        const userRole = json.role || (password === 'viewer1234' ? 'viewer' : 'admin')
        sessionStorage.setItem('admin_auth', 'true')
        sessionStorage.setItem('admin_role', userRole)
        setIsAuthenticated(true)
        setRole(userRole)
        return { ok: true, role: userRole }
      }
    } catch {}

    // Fallback if offline
    if (password === 'admin1234' || password === 'viewer1234') {
      const userRole = password === 'viewer1234' ? 'viewer' : 'admin'
      sessionStorage.setItem('admin_auth', 'true')
      sessionStorage.setItem('admin_role', userRole)
      setIsAuthenticated(true)
      setRole(userRole)
      return { ok: true, role: userRole }
    }

    return { ok: false }
  }

  const logout = () => {
    sessionStorage.removeItem('admin_auth')
    sessionStorage.removeItem('admin_role')
    setIsAuthenticated(false)
    setRole(null)
  }

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, role, isViewer: role === 'viewer', isAdmin: role === 'admin', login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => useContext(AdminAuthContext)
