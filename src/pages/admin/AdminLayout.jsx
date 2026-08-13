import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

const NAV_ITEMS = [
  { to: '/admin',            icon: '📊', label: 'Dashboard' },
  { to: '/admin/dimensions', icon: '📋', label: 'Dimensions' },
  { to: '/admin/data',       icon: '🗂️', label: 'Survey Data' },
]

export default function AdminLayout() {
  const { logout } = useAdminAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <img src="/haier-logo.png" alt="Haier" />
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>TV Survey</span>
        </div>
        <nav className="admin-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) => `admin-nav__item${isActive ? ' active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          <div style={{ flex: 1 }} />
          <a href="/" className="admin-nav__item" style={{ marginTop: 8 }}>
            <span>🏠</span><span>Survey App</span>
          </a>
          <button className="admin-nav__item" onClick={handleLogout} style={{ background: 'rgba(229,62,62,0.12)', color: '#FC8181' }}>
            <span>🚪</span><span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
