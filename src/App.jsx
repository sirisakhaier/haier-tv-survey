import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { SurveyProvider } from './context/SurveyContext'
import { DataProvider } from './context/DataContext'
import { AdminAuthProvider } from './context/AdminAuthContext'

import Landing from './pages/Landing'
import Step1Store from './pages/survey/Step1Store'
import Step2Info from './pages/survey/Step2Info'
import Step3Models from './pages/survey/Step3Models'
import Step4Photos from './pages/survey/Step4Photos'
import ReviewSubmit from './pages/survey/ReviewSubmit'
import SuccessPage from './pages/SuccessPage'

import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import DimensionManager from './pages/admin/DimensionManager'
import SurveyDataManager from './pages/admin/SurveyDataManager'
import AdminLayout from './pages/admin/AdminLayout'
import AdminRoute from './pages/admin/AdminRoute'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center', background: '#F0F4FF' }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 16, maxWidth: 420, width: '100%', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>เกิดข้อผิดพลาดในการแสดงผล</h2>
            <p style={{ fontSize: '0.85rem', color: '#718096', marginBottom: 20 }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false }); window.location.href = '/admin/login' }}
              style={{ padding: '12px 24px', background: '#0047BA', color: '#fff', border: 'none', borderRadius: 24, fontWeight: 600, cursor: 'pointer' }}
            >
              🔄 โหลดหน้า admin ใหม่
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <DataProvider>
          <AdminAuthProvider>
            <SurveyProvider>
              <Toaster
                position="top-center"
                toastOptions={{
                  style: { fontFamily: "'Noto Sans Thai', 'Inter', sans-serif", fontSize: '0.9rem' },
                  success: { duration: 3000 },
                  error: { duration: 4000 },
                }}
              />
              <Routes>
                {/* Public Survey */}
                <Route path="/" element={<Landing />} />
                <Route path="/survey/step1" element={<Step1Store />} />
                <Route path="/survey/step2" element={<Step2Info />} />
                <Route path="/survey/step3" element={<Step3Models />} />
                <Route path="/survey/step4" element={<Step4Photos />} />
                <Route path="/survey/review" element={<ReviewSubmit />} />
                <Route path="/survey/success" element={<SuccessPage />} />

                {/* Admin */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="dimensions" element={<DimensionManager />} />
                  <Route path="data" element={<SurveyDataManager />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </SurveyProvider>
          </AdminAuthProvider>
        </DataProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
