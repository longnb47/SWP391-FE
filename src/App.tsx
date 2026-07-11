import { useEffect } from 'react'
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
import OfflineDocumentsPage from './pages/OfflineDocumentsPage'
import { UserProfileProvider } from './contexts/UserProfileContext'
import { offlineDocumentService } from './services/offlineDocumentService'

import PaymentResultPage from './pages/PaymentResultPage'
function App() {
  useEffect(() => {
    const handleOnline = () => {
      if (!localStorage.getItem('token')) return;
      offlineDocumentService.synchronizeOfflineDocuments().catch((error) => {
        console.error('Background offline document sync failed:', error);
      });
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

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
          <Route path="/offline-documents" element={<OfflineDocumentsPage />} />
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
