import React, { useEffect, useRef, useState } from 'react';
import SearchInput from '../common/SearchInput';

export interface TopbarProps {
  onMobileMenuToggle?: () => void;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onHelpClick?: () => void;
  onUpgradeClick?: () => void;
  onProfileClick?: () => void;
  onBillingClick?: () => void;
  onLogoutClick?: () => void;
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
  avatarUrl?: string | null;
}

export const Topbar: React.FC<TopbarProps> = ({
  onMobileMenuToggle,
  onSearch,
  onNotificationClick,
  onHelpClick,
  onUpgradeClick,
  onProfileClick,
  onBillingClick,
  onLogoutClick,
  isLoggedIn = false,
  onLoginClick,
  avatarUrl,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleMenuItemClick = (callback?: () => void) => {
    setIsMenuOpen(false);
    if (callback) callback();
  };

  return (
    <header className="h-topbar-height bg-surface border-b border-outline-variant px-4 md:px-container-padding flex items-center justify-between shrink-0 relative z-30 select-none">
      {/* Mobile menu toggle & logo */}
      <div className="flex items-center gap-stack-sm md:gap-stack-md">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden text-secondary hover:text-on-surface hover:bg-surface-container p-1.5 rounded-full cursor-pointer transition-colors active:opacity-80"
        >
          <span className="material-symbols-outlined select-none">menu</span>
        </button>

        {/* Branding on Mobile Topbar */}
        <div className="flex items-center gap-1.5 md:hidden select-none">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined icon-fill select-none text-[18px]">cloud_sync</span>
          </div>
          <span className="font-title-md text-title-md font-bold text-on-surface tracking-tight">AetherDocs</span>
        </div>
      </div>

      {/* Global Search Input (Hidden on mobile layout) */}
      <div className="hidden md:block w-full max-w-md mx-4">
        {onSearch && <SearchInput onSearchChange={onSearch} placeholder="Search files, folders..." />}
      </div>

      {/* Utility Actions & User Menu */}
      <div className="flex items-center gap-3">
        {/* Help Icon */}
        <button
          onClick={onHelpClick}
          className="text-secondary hover:bg-surface-container-high p-2 rounded-full transition-colors scale-95 active:opacity-80 cursor-pointer select-none"
        >
          <span className="material-symbols-outlined select-none">help</span>
        </button>

        {/* Notifications Icon */}
        <button
          onClick={onNotificationClick}
          className="text-secondary hover:bg-surface-container-high p-2 rounded-full transition-colors scale-95 active:opacity-80 relative cursor-pointer select-none"
        >
          <span className="material-symbols-outlined select-none">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface" />
        </button>

        {/* Upgrade Button (Hidden on mobile/tablet) */}
        <button
          onClick={onUpgradeClick}
          className="hidden lg:block border border-outline text-primary font-label-md text-label-md px-4 py-2 rounded-lg hover:bg-primary-fixed/20 transition-all cursor-pointer font-medium"
        >
          Upgrade
        </button>

        {/* User Profile Avatar / Log In Button */}
        {isLoggedIn ? (
          <div ref={menuRef} className="relative ml-2">
            <div
              onClick={() => setIsMenuOpen((open) => !open)}
              className="w-8 h-8 rounded-full bg-surface-variant overflow-hidden cursor-pointer border-2 border-surface-container-highest hover:border-primary transition-colors flex items-center justify-center"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="User avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-[20px] text-secondary select-none">person</span>
              )}
            </div>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-surface-variant rounded-xl shadow-2xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 py-1">
                <button
                  type="button"
                  onClick={() => handleMenuItemClick(onProfileClick)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-body-md text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px] text-secondary">person</span>
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleMenuItemClick(onBillingClick)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-body-md text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px] text-secondary">receipt_long</span>
                  Billing
                </button>
                <div className="my-1 border-t border-outline-variant/50" />
                <button
                  type="button"
                  onClick={() => handleMenuItemClick(onLogoutClick)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-body-md text-error hover:bg-error-container/40 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer font-semibold"
          >
            Log In
          </button>
        )}
      </div>
    </header>
  );
};
export default Topbar;
