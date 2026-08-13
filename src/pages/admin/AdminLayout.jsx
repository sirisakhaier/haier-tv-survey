import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'
import ThemeToggle from '../../components/ThemeToggle'

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
        <div className="admin-sidebar__logo" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/haier-logo.png" alt="Haier" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>TV Survey</span>
            </div>
          </div>
          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.2 }}>
            Haier Electrical Appliances (Thailand) Co., Ltd.
          </span>
          <span style={{ fontSize: '0.65rem', color: '#90CDF4', fontWeight: 700 }}>
            Sell out team
          </span>
        </div>

        <div style={{ padding: '8px 12px' }}>
          <ThemeToggle style={{ width: '100%', justifyContent: 'center' }} />
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
