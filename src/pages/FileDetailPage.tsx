import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import DocumentPreview from '../components/document/DocumentPreview';
import DocumentChat from '../components/document/DocumentChat';
import { documentService } from '../services/documentService';
import { mockFileItems, mockSuggestedItems } from '../features/dashboard/dashboard.mock';
import type { StorageUsage } from '../features/dashboard/dashboard.mock';

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const calculateStorageUsage = (files: { fileSize: number }[], isLoggedIn: boolean) => {
  const isFallbackMode = files.length === 0;
  const usedBytes = isLoggedIn && !isFallbackMode
    ? files.reduce((sum, f) => sum + f.fileSize, 0)
    : isLoggedIn
    ? 15 * 1024 * 1024 * 1024 // 15GB mock default
    : 0;
  
  const totalBytes = isLoggedIn && !isFallbackMode
    ? 2 * 1024 * 1024 * 1024 // 2GB Free tier limit
    : isLoggedIn
    ? 100 * 1024 * 1024 * 1024
    : 2 * 1024 * 1024 * 1024;

  const usedPercentage = Math.min(100, Math.round((usedBytes / totalBytes) * 100));
  
  return {
    usedBytes,
    totalBytes,
    usedPercentage,
    formattedUsed: formatBytes(usedBytes),
    formattedTotal: isLoggedIn && !isFallbackMode ? '2 GB' : isLoggedIn ? '100 GB' : '2 GB',
  };
};

export const FileDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [documentDetails, setDocumentDetails] = useState<{
    id: number | null;
    name: string;
    size: string;
    lastModified: string;
    previewUrl: string | null;
    downloadUrl: string | null;
    contentType: string | null;
    status: string;
  } | null>(null);
  const [storage, setStorage] = useState<StorageUsage | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    if (!isLoggedIn) {
      alert('Please log in to view document details.');
      navigate('/login');
      return;
    }

    const loadDetails = async () => {
      setIsLoading(true);
      
      // Load user documents to dynamically calculate sidebar storage usage
      try {
        const listResponse = await documentService.getMyDocuments();
        if (listResponse.data && listResponse.data.success) {
          const computedStorage = calculateStorageUsage(listResponse.data.data, true);
          setStorage(computedStorage);
        }
      } catch (e) {
        console.error('Failed to load storage details:', e);
      }

      const numericId = Number(id);
      if (!isNaN(numericId)) {
        // Fetch details from backend API
        const response = await documentService.getDocumentDetail(numericId);
        
        if (response.data && response.data.success) {
          const doc = response.data.data;
          
          let previewUrl: string | null = null;
          let contentType: string | null = doc.contentType;
          try {
            const previewResponse = await documentService.getDocumentPreviewUrl(numericId);
            if (previewResponse.data && previewResponse.data.success) {
              previewUrl = previewResponse.data.data.url;
              if (previewResponse.data.data.contentType) {
                contentType = previewResponse.data.data.contentType;
              }
            }
          } catch (e) {
            console.error('Failed to load preview URL:', e);
          }

          let downloadUrl: string | null = null;
          try {
            const downloadResponse = await documentService.getDocumentDownloadUrl(numericId);
            if (downloadResponse.data && downloadResponse.data.success) {
              downloadUrl = downloadResponse.data.data.url;
            }
          } catch (e) {
            console.error('Failed to load download URL:', e);
          }

          setDocumentDetails({
            id: doc.documentId,
            name: doc.originalFileName,
            size: formatBytes(doc.fileSize),
            lastModified: new Date(doc.uploadedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            previewUrl,
            downloadUrl,
            contentType,
            status: doc.status,
          });
          setIsLoading(false);
          return;
        }
      }

      // Local mock fallback matches
      const listFile = mockFileItems.find((f) => f.id === id);
      if (listFile) {
        setDocumentDetails({
          id: null,
          name: listFile.name,
          size: listFile.size,
          lastModified: listFile.lastModified,
          previewUrl: null,
          downloadUrl: null,
          contentType: listFile.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          status: 'READY',
        });
      } else {
        const suggestedFile = mockSuggestedItems.find((f) => f.id === id);
        if (suggestedFile) {
          setDocumentDetails({
            id: null,
            name: suggestedFile.name,
            size: suggestedFile.metadata ? suggestedFile.metadata.split('•')[1]?.trim() || '1.2 MB' : '1.2 MB',
            lastModified: '2 hours ago',
            previewUrl: null,
            downloadUrl: null,
            contentType: suggestedFile.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            status: 'READY',
          });
        } else {
          // Default fallback document
          setDocumentDetails({
            id: null,
            name: 'Company Q3 Strategy & Market Analysis.pdf',
            size: '2.4 MB',
            lastModified: '2 hours ago',
            previewUrl: null,
            downloadUrl: null,
            contentType: 'application/pdf',
            status: 'READY',
          });
        }
      }
      setIsLoading(false);
    };

    loadDetails();
  }, [id, isLoggedIn, navigate]);

  const handleTabChange = (tabName: string) => {
    if (tabName !== 'AI Assistant' && tabName !== 'Settings') {
      navigate('/dashboard');
    }
  };

  if (isLoading || !documentDetails) {
    return (
      <DashboardLayout activeTab="My Files" onTabChange={handleTabChange} fluid={true} storage={storage}>
        <div className="flex-1 flex flex-col items-center justify-center py-40 gap-3 w-full bg-surface">
          <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="font-body-md text-secondary select-none">Loading document details...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeTab="My Files"
      onTabChange={handleTabChange}
      fluid={true}
      storage={storage}
    >
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden h-full w-full bg-surface">
        {/* Left Side: Document Preview (60% width) */}
        <DocumentPreview
          fileName={documentDetails.name}
          fileSize={documentDetails.size}
          lastModified={documentDetails.lastModified}
          previewUrl={documentDetails.previewUrl}
          downloadUrl={documentDetails.downloadUrl}
          contentType={documentDetails.contentType}
          onDownloadClick={() => {
            if (documentDetails.downloadUrl) {
              window.open(documentDetails.downloadUrl, '_blank');
            } else {
              alert(`Downloading "${documentDetails.name}"...`);
            }
          }}
          onShareClick={() => alert(`Sharing "${documentDetails.name}" link...`)}
          onBack={() => navigate('/dashboard')}
        />

        {/* Right Side: AI Assistant Chat (40% width) */}
        <DocumentChat fileName={documentDetails.name} status={documentDetails.status} />
      </div>
    </DashboardLayout>
  );
};

export default FileDetailPage;
