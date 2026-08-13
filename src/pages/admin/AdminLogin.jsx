import { useState } from 'react'
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'
import ThemeToggle from '../../components/ThemeToggle'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const { login, isAuthenticated, isViewer } = useAdminAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const targetRole = searchParams.get('role') === 'viewer' ? 'viewer' : 'admin'

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // If already logged in, redirect declaratively based on role
  if (isAuthenticated) {
    return <Navigate to={isViewer ? '/admin/report' : '/admin'} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    try {
      const res = await login(password)
      if (res?.ok) {
        toast.success(`เข้าสู่ระบบสำเร็จ (${res.role === 'viewer' ? 'Viewer Mode' : 'Admin Mode'})`)
        if (res.role === 'viewer') {
          navigate('/admin/report', { replace: true })
        } else {
          navigate('/admin', { replace: true })
        }
      } else {
        toast.error('รหัสผ่านไม่ถูกต้อง')
      }
    } catch {
      toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page" style={{ position: 'relative' }}>
      <ThemeToggle style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }} />
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ display: 'inline-block', marginBottom: 8 }}>
            <img src="/haier-logo.png" alt="Haier" style={{ height: 50, width: 50, borderRadius: 10, border: '2px solid var(--border-blue)' }} />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Haier Electrical Appliances (Thailand) Co., Ltd.</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--haier-blue)', fontWeight: 700, marginTop: 2, marginBottom: 8 }}>Sell out team</div>
        </div>

        {/* Role Mode Selector Tabs */}
        <div style={{ display: 'flex', background: 'var(--haier-blue-pale)', padding: 4, borderRadius: 12, marginBottom: 20 }}>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: 8,
              background: targetRole === 'admin' ? 'var(--haier-blue)' : 'transparent',
              color: targetRole === 'admin' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
            onClick={() => { setSearchParams({ role: 'admin' }); setPassword('') }}
          >
            🔑 Admin Login
          </button>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: 8,
              background: targetRole === 'viewer' ? '#ED8936' : 'transparent',
              color: targetRole === 'viewer' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
            onClick={() => { setSearchParams({ role: 'viewer' }); setPassword('') }}
          >
            👁️ Viewer Login
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">
              {targetRole === 'viewer' ? 'รหัสผ่าน Viewer (Password)' : 'รหัสผ่าน Admin (Password)'}
            </label>
            <input
              id="admin-password"
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              autoComplete="current-password"
            />
          </div>
          <button
            id="admin-login-btn"
            type="submit"
            className="btn btn--block"
            style={{
              background: targetRole === 'viewer' ? '#ED8936' : 'var(--haier-blue)',
              color: '#fff',
              fontWeight: 700,
            }}
            disabled={loading || !password}
          >
            {loading ? <><div className="spinner" />กำลังเข้าสู่ระบบ...</> : (targetRole === 'viewer' ? '👁️ เข้าสู่ระบบ Viewer' : '🔑 เข้าสู่ระบบ Admin')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>← กลับหน้าสำรวจ</a>
        </div>
      </div>
    </div>
  )
}
