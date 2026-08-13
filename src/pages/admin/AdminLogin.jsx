import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'
import ThemeToggle from '../../components/ThemeToggle'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const { login, isAuthenticated } = useAdminAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // If already logged in, redirect declaratively
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    try {
      const ok = await login(password)
      if (ok) {
        toast.success('เข้าสู่ระบบสำเร็จ')
        navigate('/admin', { replace: true })
      } else {
        toast.error('รหัสผ่านไม่ถูกต้อง (Default: admin1234)')
      }
    } catch (err) {
      toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page" style={{ position: 'relative' }}>
      <ThemeToggle style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }} />
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-block', marginBottom: 12 }}>
            <img src="/haier-logo.png" alt="Haier" style={{ height: 52, width: 52, borderRadius: 10, border: '2px solid var(--border-blue)' }} />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Haier Electrical Appliances (Thailand) Co., Ltd.</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--haier-blue)', fontWeight: 700, marginTop: 2, marginBottom: 8 }}>Sell out team</div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>Admin Management Panel</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">รหัสผ่าน (Password)</label>
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
            className="btn btn--primary btn--block"
            disabled={loading || !password}
          >
            {loading ? <><div className="spinner" />กำลังเข้าสู่ระบบ...</> : '🔑 เข้าสู่ระบบ'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>← กลับหน้าสำรวจ</a>
        </div>
      </div>
    </div>
  )
}
