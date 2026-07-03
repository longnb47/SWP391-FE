import React, { useEffect, useRef, useState } from 'react';
import SearchInput from '../common/SearchInput';

export interface TopbarProps {
  onMobileMenuToggle?: () => void;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onHelpClick?: () => void;
  onUpgradeClick?: () => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
  isLoggedIn?: boolean;
  onLoginClick?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onMobileMenuToggle,
  onSearch,
  onNotificationClick,
  onHelpClick,
  onUpgradeClick,
  onProfileClick,
  onSettingsClick,
  onLogoutClick,
  isLoggedIn = false,
  onLoginClick,
}) => {
  const userAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuBPOtHdkK3q1RuRa0eWcRdWrXzjGxNBb9CAYqiXL5iBvNhQZQKl7G0RGvQ79sGLRsIPXdXqVkDlXJqkt0UPTXJalUAP6p4RkSEjwYJ8H9iKPvuxItA4WRqbxBCNFbvShzoA909VlVFgtS8fL4dwS6fFkEFZzxHenm3dB1rqCqYPAgBhPHIkmjO0p_oSBgm0_2tiaaN_2CMEkV3a9xGXRPmwKn5fhRh9vsfU5eo4hGgX0RswA9Mpg5hf81M-6Ig3sUttXhMJjEOtPLvr";

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

  const handleMenuItemClick = (action?: () => void) => {
    setIsMenuOpen(false);
    if (action) action();
  };

  return (
    <header className="flex justify-between items-center px-gutter w-full sticky top-0 z-30 shadow-sm bg-surface h-16 border-b border-outline-variant/30 select-none">
      {/* Left Area: Mobile Menu Toggle & App Name */}
      <div className="flex items-center">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 -ml-2 text-secondary hover:bg-surface-container-high rounded-full transition-colors mr-2 cursor-pointer"
          >
            <span className="material-symbols-outlined select-none">menu</span>
          </button>
        )}
      </div>

      {/* Middle Area: Search bar */}
      <div className="flex-1 flex items-center max-w-2xl md:ml-0">
        <SearchInput onSearchChange={onSearch} />
      </div>

      {/* Right Area: Actions */}
      <div className="flex items-center gap-2 sm:gap-4 ml-4">
        {/* Help button (Hidden on very small screens) */}
        <button
          onClick={onHelpClick}
          className="text-secondary hover:bg-surface-container-high p-2 rounded-full transition-colors scale-95 active:opacity-80 hidden sm:block cursor-pointer select-none"
        >
          <span className="material-symbols-outlined select-none">help</span>
        </button>

        {/* Notifications button */}
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
              className="w-8 h-8 rounded-full bg-surface-variant overflow-hidden cursor-pointer border-2 border-surface-container-highest hover:border-primary transition-colors"
            >
              <img
                src={userAvatar}
                alt="User avatar"
                className="w-full h-full object-cover"
              />
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
                  onClick={() => handleMenuItemClick(onSettingsClick)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-body-md text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px] text-secondary">settings</span>
                  Settings
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
