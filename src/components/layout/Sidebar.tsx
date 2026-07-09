import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import StorageUsageCard from '../dashboard/StorageUsageCard';
import { mockStorageUsage } from '../../features/dashboard/dashboard.mock';
import type { StorageUsage } from '../../features/dashboard/dashboard.mock';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onUploadClick?: () => void;
  onNewFolderClick?: () => void;
  storage?: StorageUsage;
}

interface SidebarContentProps {
  onClose?: () => void;
  activeTab: string;
  onTabChange?: (tab: string) => void;
  onUploadClick?: () => void;
  onNewFolderClick?: () => void;
  storage?: StorageUsage;
}

const navItems = [
  { name: 'My Files', icon: 'folder_open' },
  { name: 'Smart Search', icon: 'travel_explore' },
  { name: 'Community', icon: 'public' },
  { name: 'Shared', icon: 'group' },
  { name: 'Offline', icon: 'offline_pin' },
  { name: 'Friends', icon: 'person_add' },
  { name: 'Starred', icon: 'star' },
  { name: 'Trash', icon: 'delete' },
];

const SidebarContent: React.FC<SidebarContentProps> = ({
  onClose,
  activeTab,
  onTabChange,
  onUploadClick,
  onNewFolderClick,
  storage,
}) => {
  const navigate = useNavigate();

  const handleTabClick = (tabName: string) => {
    if (tabName === 'Offline') {
      navigate('/offline-documents');
      if (onClose) onClose();
      return;
    }

    if (onTabChange) {
      // Already on a page that manages tabs locally (e.g. the dashboard) - switch in place.
      onTabChange(tabName);
    } else {
      // No local tab handler (e.g. viewing from /profile) - navigate to the dashboard,
      // which restores the requested tab from location.state on mount.
      navigate('/dashboard', { state: { activeTab: tabName } });
    }
    if (onClose) onClose(); // Close mobile sidebar
  };

  return (
    <div className="flex flex-col h-full py-container-padding bg-surface-container-low">
      {/* Brand Header */}
      <div className="px-container-padding mb-stack-lg flex justify-between items-center">
        <div className="flex items-center gap-stack-md">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
            <span className="material-symbols-outlined icon-fill select-none text-[22px]">cloud_sync</span>
          </div>
          <div>
            <h1 className="font-title-lg text-title-lg font-black text-on-surface tracking-tight">AetherDocs</h1>
            <p className="font-label-md text-label-md text-secondary select-none">Intelligent Storage</p>
          </div>
        </div>
        
        {/* Mobile close button */}
        {onClose && (
          <button 
            onClick={onClose} 
            className="md:hidden p-1.5 text-secondary hover:text-on-surface hover:bg-surface-container rounded-full cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {/* Primary CTAs */}
      <div className="px-container-padding mb-stack-lg">
        <div className="flex flex-col gap-stack-md">
          <Button
            variant="primary"
            leftIcon="upload_file"
            onClick={onUploadClick}
            className="w-full justify-start py-3"
          >
            Upload File
          </Button>
          <Button
            variant="outline"
            leftIcon="create_new_folder"
            onClick={onNewFolderClick}
            className="w-full justify-start py-3"
          >
            New Folder
          </Button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto select-none">
        {navItems.map((item) => {
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => handleTabClick(item.name)}
              className={`w-full text-left flex items-center gap-stack-md px-4 py-2 rounded-lg transition-all duration-200 ease-in-out group cursor-pointer ${
                isActive
                  ? 'text-on-primary-container font-bold bg-primary/10 border-l-4 border-primary rounded-l-none'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span
                className={`material-symbols-outlined transition-transform duration-200 ${
                  isActive ? 'icon-fill text-primary' : 'group-hover:scale-110'
                }`}
                style={{ fontSize: '20px' }}
              >
                {item.icon}
              </span>
              <span className="font-label-md text-label-md">{item.name}</span>
            </button>
          );
        })}

        <div className="my-4 border-t border-outline-variant/50 mx-4" />

        {/* AI Assistant Tab */}
        <button
          type="button"
          onClick={() => handleTabClick('AI Assistant')}
          className={`w-full text-left flex items-center gap-stack-md px-4 py-2 rounded-lg transition-all duration-200 ease-in-out group cursor-pointer ${
            activeTab === 'AI Assistant'
              ? 'text-tertiary font-bold bg-tertiary-fixed/30 border-l-4 border-tertiary rounded-l-none'
              : 'text-tertiary hover:text-tertiary-container hover:bg-tertiary-fixed/30'
          }`}
        >
          <span
            className="material-symbols-outlined group-hover:animate-pulse"
            style={{ fontSize: '20px' }}
          >
            smart_toy
          </span>
          <span className="font-label-md text-label-md">AI Assistant</span>
        </button>
      </nav>

      {/* Footer Area */}
      <div className="mt-auto px-3 pt-4 border-t border-outline-variant">
        {/* Storage usage widget */}
        <StorageUsageCard storage={storage || mockStorageUsage} />
        
        {/* Settings tab */}
        <button
          type="button"
          onClick={() => handleTabClick('Settings')}
          className={`w-full text-left flex items-center gap-stack-md px-4 py-2 rounded-lg transition-all duration-200 ease-in-out cursor-pointer ${
            activeTab === 'Settings'
              ? 'text-on-surface font-bold bg-surface-container border-l-4 border-secondary rounded-l-none'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            settings
          </span>
          <span className="font-label-md text-label-md">Settings</span>
        </button>
      </div>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  activeTab = 'My Files',
  onTabChange,
  onUploadClick,
  onNewFolderClick,
  storage,
}) => {
  return (
    <>
      {/* 1. Desktop Sidebar */}
      <aside className="w-sidebar-width h-screen fixed left-0 top-0 hidden md:flex flex-col border-r border-outline-variant bg-surface-container-low shadow-sm z-40">
        <SidebarContent
          activeTab={activeTab}
          onTabChange={onTabChange}
          onUploadClick={onUploadClick}
          onNewFolderClick={onNewFolderClick}
          storage={storage}
        />
      </aside>

      {/* 2. Mobile Sidebar Slide-out Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop Overlay */}
          <div
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          />
          {/* Sliding Panel */}
          <aside className="absolute left-0 top-0 w-sidebar-width h-full bg-surface-container-low border-r border-outline-variant flex flex-col shadow-xl animate-in slide-in-from-left duration-250">
            <SidebarContent
              onClose={onClose}
              activeTab={activeTab}
              onTabChange={onTabChange}
              onUploadClick={onUploadClick}
              onNewFolderClick={onNewFolderClick}
              storage={storage}
            />
          </aside>
        </div>
      )}
    </>
  );
};
export default Sidebar;
