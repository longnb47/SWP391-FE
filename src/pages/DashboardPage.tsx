import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import SuggestedFilesSection from '../components/dashboard/SuggestedFilesSection';
import FileList from '../components/dashboard/FileList';
import {
  mockSuggestedItems,
  mockFileItems,
} from '../features/dashboard/dashboard.mock';
import type {
  FileItem,
  SuggestedItem,
} from '../features/dashboard/dashboard.mock';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('My Files');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [fileItems, setFileItems] = useState<FileItem[]>(mockFileItems);
  const [suggestedItems] = useState<SuggestedItem[]>(mockSuggestedItems);
  const [isUploading, setIsUploading] = useState(false);

  // Search filtering
  const filteredFiles = fileItems.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Live actions triggers
  const handleUploadFile = () => {
    setIsUploading(true);
    const fileName = prompt('Enter the name of the file to upload:');
    if (!fileName) {
      setIsUploading(false);
      return;
    }

    setTimeout(() => {
      const extension = fileName.includes('.') ? '' : '.txt';
      const fileType = fileName.match(/\.(png|jpg|jpeg|gif)$/i)
        ? 'image'
        : fileName.match(/\.(pdf|doc|docx|txt|xls|xlsx)$/i)
        ? 'document'
        : 'file';

      const newFile: FileItem = {
        id: `f-${Date.now()}`,
        name: `${fileName}${extension}`,
        type: 'file',
        fileType,
        icon: fileType === 'image' ? 'image' : 'description',
        tags: ['New', 'Uploaded'],
        owner: 'Me',
        lastModified: 'Just now',
        size: '12 KB',
      };

      setFileItems([newFile, ...fileItems]);
      setIsUploading(false);
      alert('File uploaded successfully!');
    }, 800);
  };

  const handleNewFolder = () => {
    const folderName = prompt('Enter new folder name:');
    if (!folderName) return;

    const newFolder: FileItem = {
      id: `f-${Date.now()}`,
      name: folderName,
      type: 'folder',
      tags: ['Local'],
      owner: 'Me',
      lastModified: 'Just now',
      size: '--',
    };

    setFileItems([newFolder, ...fileItems]);
    alert(`Folder "${folderName}" created successfully!`);
  };

  const handleItemClick = (item: FileItem) => {
    navigate(`/document/${item.id}`);
  };

  const handleSuggestedItemClick = (item: SuggestedItem) => {
    navigate(`/document/${item.id}`);
  };

  const handleAiActionClick = (item: SuggestedItem) => {
    alert(`AI analysis triggered for: "${item.name}"!`);
  };

  const handleItemActionClick = (item: FileItem, action: string) => {
    if (action === 'delete') {
      const confirmDelete = window.confirm(`Are you sure you want to delete "${item.name}"?`);
      if (confirmDelete) {
        setFileItems(fileItems.filter((f) => f.id !== item.id));
      }
    } else if (action === 'rename') {
      const newName = prompt(`Enter new name for "${item.name}":`, item.name);
      if (newName) {
        setFileItems(
          fileItems.map((f) => (f.id === item.id ? { ...f, name: newName } : f))
        );
      }
    } else if (action === 'star') {
      setFileItems(
        fileItems.map((f) => (f.id === item.id ? { ...f, isStarred: !f.isStarred } : f))
      );
      alert(`${item.name} has been ${item.isStarred ? 'unstarred' : 'starred'}!`);
    } else if (action === 'open') {
      handleItemClick(item);
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSearch={setSearchQuery}
      onUploadClick={handleUploadFile}
      onNewFolderClick={handleNewFolder}
    >
      {/* 1. Suggested Bento Grid Area */}
      {searchQuery === '' && (
        <SuggestedFilesSection
          items={suggestedItems}
          onItemClick={handleSuggestedItemClick}
          onAiActionClick={handleAiActionClick}
        />
      )}

      {/* 2. Main File List / Grid Section */}
      <section className="space-y-4">
        {/* Section Header with View Toggles */}
        <div className="flex items-center justify-between">
          <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface select-none">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Files & Folders'}
          </h2>
          <div className="flex items-center gap-2 select-none">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors border cursor-pointer ${
                viewMode === 'grid'
                  ? 'text-primary bg-primary-fixed/30 border-primary/20'
                  : 'text-secondary hover:bg-surface-container-high border-transparent hover:border-outline-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors border cursor-pointer ${
                viewMode === 'list'
                  ? 'text-primary bg-primary-fixed/30 border-primary/20'
                  : 'text-secondary hover:bg-surface-container-high border-transparent hover:border-outline-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </button>
            
            <button 
              onClick={() => alert('Filter files clicked!')}
              className="p-2 text-secondary hover:bg-surface-container-high rounded-lg transition-colors border border-transparent hover:border-outline-variant ml-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
          </div>
        </div>

        {/* Dynamic Layout switching */}
        {viewMode === 'list' ? (
          <FileList
            items={filteredFiles}
            isLoading={isUploading}
            onItemClick={handleItemClick}
            onItemActionClick={handleItemActionClick}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFiles.map((file) => {
              const isFolder = file.type.startsWith('folder');
              return (
                <div
                  key={file.id}
                  onClick={() => handleItemClick(file)}
                  className="group bg-surface rounded-xl border border-surface-variant p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 cursor-pointer flex flex-col justify-between h-40 relative"
                >
                  <div className="flex justify-between items-start">
                    <span 
                      className={`material-symbols-outlined text-display-lg icon-fill select-none ${
                        isFolder ? 'text-primary/70' : file.fileType === 'document' ? 'text-[#1b73e8]' : 'text-primary/50'
                      }`}
                    >
                      {isFolder ? 'folder' : file.fileType === 'image' ? 'image' : 'description'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemActionClick(file, 'delete');
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-secondary hover:text-error rounded transition-opacity cursor-pointer select-none"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                  <div>
                    <h4 className="font-label-md text-label-md text-on-surface font-semibold truncate group-hover:text-primary transition-colors">
                      {file.name}
                    </h4>
                    <p className="font-mono-label text-[10px] text-secondary mt-1">
                      {file.size === '--' ? 'Folder' : file.size} • {file.lastModified}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};
export default DashboardPage;
