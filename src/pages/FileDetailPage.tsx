import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import DocumentPreview from '../components/document/DocumentPreview';
import DocumentChat from '../components/document/DocumentChat';
import { documentService } from '../services/documentService';
import { mockFileItems, mockSuggestedItems } from '../features/dashboard/dashboard.mock';

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const FileDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [documentDetails, setDocumentDetails] = useState<{
    name: string;
    size: string;
    lastModified: string;
  } | null>(null);
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
      
      const numericId = Number(id);
      if (!isNaN(numericId)) {
        // Fetch details from backend API
        const response = await documentService.getDocumentDetail(numericId);
        
        if (response.data && response.data.success) {
          const doc = response.data.data;
          setDocumentDetails({
            name: doc.originalFileName,
            size: formatBytes(doc.fileSize),
            lastModified: new Date(doc.uploadedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          });
          setIsLoading(false);
          return;
        }
      }

      // Local mock fallback matches
      const listFile = mockFileItems.find((f) => f.id === id);
      if (listFile) {
        setDocumentDetails({
          name: listFile.name,
          size: listFile.size,
          lastModified: listFile.lastModified,
        });
      } else {
        const suggestedFile = mockSuggestedItems.find((f) => f.id === id);
        if (suggestedFile) {
          setDocumentDetails({
            name: suggestedFile.name,
            size: suggestedFile.metadata ? suggestedFile.metadata.split('•')[1]?.trim() || '1.2 MB' : '1.2 MB',
            lastModified: '2 hours ago',
          });
        } else {
          // Default fallback document
          setDocumentDetails({
            name: 'Company Q3 Strategy & Market Analysis.pdf',
            size: '2.4 MB',
            lastModified: '2 hours ago',
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
      <DashboardLayout activeTab="My Files" onTabChange={handleTabChange} fluid={true}>
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
    >
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden h-full w-full bg-surface">
        {/* Left Side: Document Preview (60% width) */}
        <DocumentPreview
          fileName={documentDetails.name}
          fileSize={documentDetails.size}
          lastModified={documentDetails.lastModified}
          onDownloadClick={() => alert(`Downloading "${documentDetails.name}"...`)}
          onShareClick={() => alert(`Sharing "${documentDetails.name}" link...`)}
        />

        {/* Right Side: AI Assistant Chat (40% width) */}
        <DocumentChat fileName={documentDetails.name} />
      </div>
    </DashboardLayout>
  );
};

export default FileDetailPage;
