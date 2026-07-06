import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import FileDetailPage from './pages/FileDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyOtpPage from './pages/VerifyOtpPage'
import OAuth2RedirectHandler from './pages/OAuth2RedirectHandler'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import SharedLinkPage from './pages/SharedLinkPage'
import ProfilePage from './pages/ProfilePage'
import { UserProfileProvider } from './contexts/UserProfileContext'
import PaymentResultPage from './pages/PaymentResultPage'
function App() {
  return (
    <UserProfileProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/document/:id" element={<FileDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/share/:token" element={<SharedLinkPage />} />
          <Route path="/payment-result" element={<PaymentResultPage />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </UserProfileProvider>
  )
}

export default App
