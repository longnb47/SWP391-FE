import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import SubscriptionModal from '../components/dashboard/SubscriptionModal';
import BillingModal from '../components/dashboard/BillingModal';
import { authService } from '../services/authService';
import { useUserProfile } from '../contexts/UserProfileContext';
import type { StorageUsage } from '../features/dashboard/dashboard.mock';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onSearch?: (query: string) => void;
  onUploadClick?: () => void;
  onNewFolderClick?: () => void;
  fluid?: boolean;
  storage?: StorageUsage;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab = 'My Files',
  onTabChange,
  onSearch,
  onUploadClick,
  onNewFolderClick,
  fluid = false,
  storage,
}) => {
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const isLoggedIn = !!localStorage.getItem('token');
  const { avatarUrl } = useUserProfile();

  const handleMobileMenuToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to log out?');
    if (!confirmLogout) return;

    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch (err) {
        console.error('Logout error on backend:', err);
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex overflow-hidden selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Sidebar Navigation (Static on Desktop, Drawer on Mobile) */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={handleSidebarClose}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onUploadClick={onUploadClick}
        onNewFolderClick={onNewFolderClick}
        storage={storage}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-sidebar-width h-screen w-full relative overflow-hidden">
        {/* Top bar header */}
        <Topbar
          onMobileMenuToggle={handleMobileMenuToggle}
          onSearch={onSearch}
          onNotificationClick={() => alert('Notifications clicked!')}
          onHelpClick={() => alert('Help center clicked!')}
          onUpgradeClick={() => setIsSubModalOpen(true)}
          onBillingClick={() => setIsBillingModalOpen(true)}
          isLoggedIn={isLoggedIn}
          onLoginClick={() => navigate('/login')}
          onProfileClick={() => navigate('/profile')}
          onLogoutClick={handleLogout}
          avatarUrl={avatarUrl}
        />

        {/* Scrollable Main Canvas */}
        {fluid ? (
          <main className="flex-1 flex overflow-hidden bg-surface relative">
            {children}
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 md:p-container-padding pb-20 md:pb-8">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
              {children}
            </div>
          </main>
        )}
      </div>

      {/* Subscription Plans Modal */}
      <SubscriptionModal 
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
      />

      {/* Billing History Modal */}
      <BillingModal
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
      />
    </div>
  );
};
export default DashboardLayout;
