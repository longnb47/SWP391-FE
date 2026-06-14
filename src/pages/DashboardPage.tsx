import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import SuggestedFilesSection from '../components/dashboard/SuggestedFilesSection';
import FileList from '../components/dashboard/FileList';
import { documentService } from '../services/documentService';
import type { DocumentUploadResponse } from '../services/documentService';
import {
  mockSuggestedItems,
  mockFileItems,
} from '../features/dashboard/dashboard.mock';
import type {
  FileItem,
  SuggestedItem,
} from '../features/dashboard/dashboard.mock';

// Utility helper to format bytes
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('My Files');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isUploading, setIsUploading] = useState(false);
  
  // Real API states
  const [apiFiles, setApiFiles] = useState<DocumentUploadResponse[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  const isLoggedIn = !!localStorage.getItem('token');

  // Load files from backend
  const fetchFiles = async () => {
    if (!isLoggedIn) {
      setApiFiles([]);
      setIsFallbackMode(false);
      setIsLoadingFiles(false);
      return;
    }
    const response = await documentService.getMyDocuments();
    if (response.data && response.data.success) {
      setApiFiles(response.data.data);
      setIsFallbackMode(false);
    } else {
      console.warn('API error or server offline. Falling back to local mock data.', response.error);
      setIsFallbackMode(true);
    }
    setIsLoadingFiles(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map backend files to frontend FileItems
  const mapApiFileToFileItem = (doc: DocumentUploadResponse): FileItem => {
    const fileType = doc.contentType.startsWith('image/')
      ? 'image'
      : doc.contentType.includes('pdf') || doc.contentType.includes('word') || doc.contentType.includes('officedocument')
      ? 'document'
      : 'file';

    return {
      id: String(doc.documentId),
      name: doc.originalFileName,
      type: 'file',
      fileType,
      icon: fileType === 'image' ? 'image' : 'description',
      tags: [doc.status], // e.g. UPLOADED, READY
      owner: 'Me',
      lastModified: new Date(doc.uploadedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      size: formatBytes(doc.fileSize),
    };
  };

  // Compile final file list: mock folders + S3 files, or complete local mock if offline
  const mockFolders = mockFileItems.filter((f) => f.type.startsWith('folder'));
  const fileItems: FileItem[] = !isLoggedIn
    ? []
    : isFallbackMode
    ? mockFileItems
    : [...mockFolders, ...apiFiles.map(mapApiFileToFileItem)];

  const suggestedItems: SuggestedItem[] = isLoggedIn ? mockSuggestedItems : [];

  // Calculate dynamic storage usage metrics
  const usedBytes = isLoggedIn && !isFallbackMode && apiFiles.length > 0
    ? apiFiles.reduce((sum, f) => sum + f.fileSize, 0)
    : isLoggedIn
    ? 15 * 1024 * 1024 * 1024 // 15GB mock default
    : 0; // 0 Bytes for guests
  
  const totalBytes = isLoggedIn && !isFallbackMode && apiFiles.length > 0
    ? 2 * 1024 * 1024 * 1024 // 2GB Free tier limit
    : isLoggedIn
    ? 100 * 1024 * 1024 * 1024 // 100GB mock default
    : 2 * 1024 * 1024 * 1024; // 2GB for guests

  const usedPercentage = Math.min(100, Math.round((usedBytes / totalBytes) * 100));
  const dynamicStorage = {
    usedBytes,
    totalBytes,
    usedPercentage,
    formattedUsed: formatBytes(usedBytes),
    formattedTotal: isLoggedIn && !isFallbackMode && apiFiles.length > 0 ? '2 GB' : isLoggedIn ? '100 GB' : '2 GB',
  };

  // Search filtering
  const filteredFiles = fileItems.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Trigger S3 File Upload
  const handleUploadFile = () => {
    if (!isLoggedIn) {
      alert('Please log in to upload files.');
      navigate('/login');
      return;
    }
    // Dynamically create a file input in JavaScript
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.pptx,.xls,.xlsx,.png,image/*';
    
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      // Validate file size (Max 20MB according to contract)
      const MAX_SIZE_LIMIT = 20 * 1024 * 1024; // 20MB in bytes
      if (file.size === 0) {
        alert('Upload failed: Empty files are not allowed.');
        return;
      }
      if (file.size > MAX_SIZE_LIMIT) {
        alert('Upload failed: File size exceeds the maximum limit of 20MB.');
        return;
      }

      setIsUploading(true);
      const response = await documentService.uploadDocument(file);
      
      if (response.data && response.data.success) {
        alert('File uploaded successfully to backend!');
        setIsLoadingFiles(true);
        fetchFiles(); // Reload list
      } else {
        alert(`Upload failed: ${response.error || 'Server error'}`);
      }
      setIsUploading(false);
    };
    
    input.click();
  };

  const handleNewFolder = () => {
    if (!isLoggedIn) {
      alert('Please log in to create folders.');
      navigate('/login');
      return;
    }
    alert('Creating folders is mocked in current version.');
  };

  const handleItemClick = (item: FileItem) => {
    if (!isLoggedIn) {
      alert('Please log in to view file details.');
      navigate('/login');
      return;
    }
    navigate(`/document/${item.id}`);
  };

  const handleSuggestedItemClick = (item: SuggestedItem) => {
    if (!isLoggedIn) {
      alert('Please log in to view file details.');
      navigate('/login');
      return;
    }
    navigate(`/document/${item.id}`);
  };

  const handleAiActionClick = (item: SuggestedItem) => {
    if (!isLoggedIn) {
      alert('Please log in to use AI actions.');
      navigate('/login');
      return;
    }
    alert(`AI analysis triggered for: "${item.name}"!`);
  };

  const handleItemActionClick = async (item: FileItem, action: string) => {
    if (!isLoggedIn) {
      alert('Please log in to perform this action.');
      navigate('/login');
      return;
    }
    if (action === 'delete') {
      const confirmDelete = window.confirm(`Are you sure you want to delete "${item.name}"?`);
      if (!confirmDelete) return;

      // Check if it's a real API file (numeric ID)
      const numericId = Number(item.id);
      if (!isNaN(numericId) && !isFallbackMode) {
        setIsLoadingFiles(true);
        const response = await documentService.deleteDocument(numericId);
        if (response.data && response.data.success) {
          alert('Document moved to trash successfully!');
          fetchFiles();
        } else {
          alert(`Failed to delete document: ${response.error || 'Server error'}`);
          setIsLoadingFiles(false);
        }
      } else {
        // Mock fallback delete
        alert(`Mock soft-deleted: ${item.name}`);
      }
    } else if (action === 'rename') {
      alert('Rename API is not supported yet by backend contract.');
    } else if (action === 'star') {
      alert('Starring API is not supported yet by backend contract.');
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
      storage={dynamicStorage}
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
            isLoading={isLoadingFiles || isUploading}
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
