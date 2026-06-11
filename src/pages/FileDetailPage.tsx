import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import DocumentPreview from '../components/document/DocumentPreview';
import DocumentChat from '../components/document/DocumentChat';
import { mockFileItems, mockSuggestedItems } from '../features/dashboard/dashboard.mock';

export const FileDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Find document based on ID in mock files or mock suggestions
  const findDocument = () => {
    const listFile = mockFileItems.find((f) => f.id === id);
    if (listFile) return listFile;

    const suggestedFile = mockSuggestedItems.find((f) => f.id === id);
    if (suggestedFile) {
      return {
        id: suggestedFile.id,
        name: suggestedFile.name,
        size: suggestedFile.metadata ? suggestedFile.metadata.split('•')[1]?.trim() || '1.2 MB' : '1.2 MB',
        lastModified: '2 hours ago',
        type: 'file',
      };
    }

    // Default fallback document matching code.html specs
    return {
      id: 'default',
      name: 'Company Q3 Strategy & Market Analysis.pdf',
      size: '2.4 MB',
      lastModified: '2 hours ago',
      type: 'file',
    };
  };

  const document = findDocument();

  // Go back helper
  const handleTabChange = (tabName: string) => {
    if (tabName !== 'AI Assistant' && tabName !== 'Settings') {
      navigate('/dashboard');
    }
  };

  return (
    <DashboardLayout
      activeTab="My Files"
      onTabChange={handleTabChange}
      fluid={true}
    >
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden h-full w-full bg-surface">
        {/* Left Side: Document Preview (60% width) */}
        <DocumentPreview
          fileName={document.name}
          fileSize={document.size}
          lastModified={document.lastModified}
          onDownloadClick={() => alert(`Downloading "${document.name}"...`)}
          onShareClick={() => alert(`Sharing "${document.name}" link...`)}
        />

        {/* Right Side: AI Assistant Chat (40% width) */}
        <DocumentChat fileName={document.name} />
      </div>
    </DashboardLayout>
  );
};

export default FileDetailPage;
