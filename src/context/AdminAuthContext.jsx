import { createContext, useContext, useState } from 'react'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('admin_auth') === 'true'
  )

  const login = async (password) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      sessionStorage.setItem('admin_auth', 'true')
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  const logout = () => {
    sessionStorage.removeItem('admin_auth')
    setIsAuthenticated(false)
  }

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => useContext(AdminAuthContext)
