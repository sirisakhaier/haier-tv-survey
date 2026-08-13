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

export default function App() {
  return (
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
  )
}
