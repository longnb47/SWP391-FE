import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import DocumentPreview from '../components/document/DocumentPreview';
import DocumentChat from '../components/document/DocumentChat';
import { documentService } from '../services/documentService';
import { isOfflinePreviewSupported, offlineDocumentService } from '../services/offlineDocumentService';
import { deleteOfflineDocument, getOfflineDocument, isOfflineDocumentSaved } from '../lib/offlineDocumentDb';
import type { OfflineDocumentRecord } from '../lib/offlineDocumentDb';
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

const formatOfflineRecordDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || 'Unknown';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const isValidOfflineRecord = (record: OfflineDocumentRecord | undefined): record is OfflineDocumentRecord =>
  !!record &&
  record.blob instanceof Blob &&
  record.blob.size > 0 &&
  Number.isFinite(record.documentId) &&
  !!record.fileName &&
  !!record.contentType &&
  Number.isFinite(record.fileSize) &&
  record.fileSize > 0;

export const FileDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    fromTab?: string;
    fromFolderId?: number | null;
    fromFolderName?: string | null;
  } | null;

  const fromTab = state?.fromTab || 'My Files';
  const fromFolderId = state?.fromFolderId !== undefined ? state.fromFolderId : null;
  const fromFolderName = state?.fromFolderName !== undefined ? state.fromFolderName : null;

  const [documentDetails, setDocumentDetails] = useState<{
    id: number | null;
    name: string;
    size: string;
    lastModified: string;
    previewUrl: string | null;
    downloadUrl: string | null;
    contentType: string | null;
    status: string;
    userId?: number | null;
    fileSizeBytes?: number;
    uploadedAt?: string;
  } | null>(null);
  const [storage, setStorage] = useState<StorageUsage | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [localBlobUrl, setLocalBlobUrl] = useState<string | null>(null);
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);
  const [isOfflineActionLoading, setIsOfflineActionLoading] = useState(false);
  const [offlineUnavailableMessage, setOfflineUnavailableMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [offlineFeedback, setOfflineFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const saveInProgressRef = useRef(false);
  const removeInProgressRef = useRef(false);

  const isLoggedIn = !!localStorage.getItem('token');
  const currentUserId = Number(localStorage.getItem('userId')) || null;

  const replaceLocalBlobUrl = (nextUrl: string | null) => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    blobUrlRef.current = nextUrl;
    setLocalBlobUrl(nextUrl);
  };

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineFeedback({ type: 'success', message: 'Back online. Document actions are available again.' });
    };
    const handleOffline = () => {
      setIsOnline(false);
      setOfflineFeedback({ type: 'info', message: 'You are offline. Saved documents can still be opened from this browser.' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      alert('Please log in to view document details.');
      navigate('/login');
      return;
    }

    const loadDetails = async () => {
      setIsLoading(true);
      setOfflineUnavailableMessage(null);
      setOfflineFeedback(null);
      replaceLocalBlobUrl(null);
      setIsOfflineSaved(false);

      const numericId = Number(id);
      if (!isNaN(numericId) && !isOnline) {
        try {
          const offlineRecord = await getOfflineDocument(numericId, currentUserId);
          if (isValidOfflineRecord(offlineRecord)) {
            let blobUrl: string;
            try {
              blobUrl = URL.createObjectURL(offlineRecord.blob);
            } catch (e) {
              console.error('Failed to create offline document URL:', e);
              setDocumentDetails(null);
              setOfflineUnavailableMessage('Document unavailable offline. The saved copy could not be opened by this browser.');
              setOfflineFeedback({ type: 'error', message: 'The saved copy could not be opened. Try reconnecting and saving it again.' });
              setIsLoading(false);
              return;
            }

            replaceLocalBlobUrl(blobUrl);
            setIsOfflineSaved(true);
            setDocumentDetails({
              id: offlineRecord.documentId,
              name: offlineRecord.fileName,
              size: formatBytes(offlineRecord.fileSize),
              lastModified: formatOfflineRecordDate(offlineRecord.lastModified),
              previewUrl: null,
              downloadUrl: null,
              contentType: offlineRecord.contentType,
              status: 'READY',
              userId: offlineRecord.userId,
              fileSizeBytes: offlineRecord.fileSize,
              uploadedAt: offlineRecord.lastModified,
            });
          } else if (offlineRecord) {
            await deleteOfflineDocument(numericId, currentUserId);
            setDocumentDetails(null);
            setOfflineUnavailableMessage('Document unavailable offline. The saved copy was corrupted and has been removed.');
            setOfflineFeedback({ type: 'error', message: 'The offline copy was corrupted. Reconnect and save the document again.' });
          } else {
            setDocumentDetails(null);
            setOfflineUnavailableMessage('Document unavailable offline. Reconnect and save it for offline use first.');
          }
        } catch (e) {
          console.error('Failed to load offline document:', e);
          setDocumentDetails(null);
          setOfflineUnavailableMessage('Document unavailable offline. The saved copy could not be opened.');
        } finally {
          setIsLoading(false);
        }
        return;
      }

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

      if (!isNaN(numericId)) {
        // Fetch details from backend API
        let response;
        let isPublicDoc = false;
        let isSharedDoc = false;
        
        try {
          response = await documentService.getDocumentDetail(numericId);
          if (!response.data || !response.data.success) {
            // Check if it's shared with me
            const sharedResponse = await documentService.getSharedWithMeDocumentDetail(numericId);
            if (sharedResponse.data && sharedResponse.data.success) {
              response = sharedResponse;
              isSharedDoc = true;
            } else {
              // Fallback for documents owned by other users (e.g. from community page)
              const publicResponse = await documentService.getPublicDocumentDetail(numericId);
              if (publicResponse.data && publicResponse.data.success) {
                response = publicResponse;
                isPublicDoc = true;
              }
            }
          }
        } catch (e) {
          console.warn('Failed to fetch private document detail, checking shared-with-me:', e);
          try {
            const sharedResponse = await documentService.getSharedWithMeDocumentDetail(numericId);
            if (sharedResponse.data && sharedResponse.data.success) {
              response = sharedResponse;
              isSharedDoc = true;
            } else {
              const publicResponse = await documentService.getPublicDocumentDetail(numericId);
              if (publicResponse.data && publicResponse.data.success) {
                response = publicResponse;
                isPublicDoc = true;
              }
            }
          } catch (sharedErr) {
            console.warn('Failed to load as shared document, checking public:', sharedErr);
            try {
              const publicResponse = await documentService.getPublicDocumentDetail(numericId);
              if (publicResponse.data && publicResponse.data.success) {
                response = publicResponse;
                isPublicDoc = true;
              }
            } catch (pubErr) {
              console.error('Failed to load as public document:', pubErr);
            }
          }
        }
        
        if (response && response.data && response.data.success) {
          const doc = response.data.data;
          
          let previewUrl: string | null = null;
          let contentType: string | null = doc.contentType;
          try {
            const previewResponse = isSharedDoc
              ? await documentService.getSharedWithMePreviewUrl(numericId)
              : isPublicDoc
              ? await documentService.getPublicDocumentPreviewUrl(numericId)
              : await documentService.getDocumentPreviewUrl(numericId);
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
            const downloadResponse = isSharedDoc
              ? await documentService.getSharedWithMeDownloadUrl(numericId)
              : isPublicDoc
              ? await documentService.getPublicDocumentDownloadUrl(numericId)
              : await documentService.getDocumentDownloadUrl(numericId);
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
            userId: doc.userId,
            fileSizeBytes: doc.fileSize,
            uploadedAt: doc.uploadedAt,
          });
          setIsOfflineSaved(await isOfflineDocumentSaved(doc.documentId, currentUserId));
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
          userId: null,
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
            userId: null,
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
            userId: null,
          });
        }
      }
      setIsLoading(false);
    };

    loadDetails();
  }, [id, isLoggedIn, navigate, currentUserId, isOnline]);

  const handleTabChange = (tabName: string) => {
    if (tabName !== 'AI Assistant' && tabName !== 'Settings') {
      navigate('/dashboard', { state: { activeTab: tabName } });
    }
  };

  const canUseOnlineChat = isOnline;
  const canSaveCurrentDocument =
    !!documentDetails?.id &&
    isOfflinePreviewSupported(documentDetails.name, documentDetails.contentType || '');

  const handleSaveOffline = async () => {
    if (saveInProgressRef.current) return;

    if (!documentDetails?.id || documentDetails.fileSizeBytes == null || !documentDetails.uploadedAt) {
      setOfflineFeedback({ type: 'error', message: 'This document cannot be saved offline yet.' });
      return;
    }

    if (!canSaveCurrentDocument) {
      setOfflineFeedback({
        type: 'error',
        message: 'This file type is not supported for offline preview yet. You can still download it normally.',
      });
      return;
    }

    if (!isOnline) {
      setOfflineFeedback({ type: 'error', message: 'Reconnect to the internet before saving this document offline.' });
      return;
    }

    saveInProgressRef.current = true;
    setIsOfflineActionLoading(true);
    setOfflineFeedback({ type: 'info', message: 'Downloading document for offline use...' });
    try {
      await offlineDocumentService.saveDocumentForOffline({
        documentId: documentDetails.id,
        userId: currentUserId,
        fileName: documentDetails.name,
        contentType: documentDetails.contentType || 'application/octet-stream',
        fileSize: documentDetails.fileSizeBytes,
        lastModified: documentDetails.uploadedAt,
      });
      setIsOfflineSaved(true);
      setOfflineFeedback({ type: 'success', message: `"${documentDetails.name}" is now available offline.` });
    } catch (e) {
      console.error('Failed to save document offline:', e);
      setOfflineFeedback({
        type: 'error',
        message: e instanceof Error ? e.message : 'Failed to save this document offline. Try again.',
      });
    } finally {
      saveInProgressRef.current = false;
      setIsOfflineActionLoading(false);
    }
  };

  const handleRemoveOffline = async () => {
    if (!documentDetails?.id) return;
    if (removeInProgressRef.current) return;
    const confirmed = window.confirm(`Remove the offline copy of "${documentDetails.name}" from this browser?`);
    if (!confirmed) return;

    removeInProgressRef.current = true;
    setIsOfflineActionLoading(true);
    setOfflineFeedback({ type: 'info', message: 'Removing offline copy...' });
    try {
      await deleteOfflineDocument(documentDetails.id, currentUserId);
      setIsOfflineSaved(false);
      if (localBlobUrl) {
        replaceLocalBlobUrl(null);
      }
      if (!isOnline) {
        setDocumentDetails(null);
        setOfflineUnavailableMessage('Document unavailable offline. Reconnect and save it for offline use first.');
      }
      setOfflineFeedback({ type: 'success', message: `Offline copy removed for "${documentDetails.name}".` });
    } catch (e) {
      console.error('Failed to remove offline document:', e);
      setOfflineFeedback({ type: 'error', message: 'Could not remove the offline copy. Try again.' });
    } finally {
      removeInProgressRef.current = false;
      setIsOfflineActionLoading(false);
    }
  };

  if (isLoading || !documentDetails) {
    return (
      <DashboardLayout activeTab={fromTab} onTabChange={handleTabChange} fluid={true} storage={storage}>
        <div className="flex-1 flex flex-col items-center justify-center py-40 gap-3 w-full bg-surface">
          {offlineUnavailableMessage ? (
            <>
              <span className="material-symbols-outlined text-[44px] text-secondary select-none">cloud_off</span>
              <span className="font-body-md text-secondary select-none">{offlineUnavailableMessage}</span>
              {offlineFeedback && (
                <span className={`font-body-md text-sm select-none ${
                  offlineFeedback.type === 'error'
                    ? 'text-error'
                    : offlineFeedback.type === 'success'
                    ? 'text-primary'
                    : 'text-secondary'
                }`}>
                  {offlineFeedback.message}
                </span>
              )}
            </>
          ) : (
            <>
              <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="font-body-md text-secondary select-none">Loading document details...</span>
            </>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeTab={fromTab}
      onTabChange={handleTabChange}
      fluid={true}
      storage={storage}
    >
      <div className="relative flex flex-col lg:flex-row flex-1 overflow-hidden h-full w-full bg-surface">
        {/* Left Side: Document Preview (takes up flex-[6] or full-width) */}
        <DocumentPreview
          fileName={documentDetails.name}
          fileSize={documentDetails.size}
          lastModified={documentDetails.lastModified}
          previewUrl={documentDetails.previewUrl}
          localBlobUrl={localBlobUrl}
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
          onBack={() => navigate('/dashboard', {
            state: {
              activeTab: fromTab,
              folderId: fromFolderId,
              folderName: fromFolderName,
            },
          })}
          isChatOpen={isChatOpen && canUseOnlineChat}
          onToggleChat={canUseOnlineChat ? () => setIsChatOpen(!isChatOpen) : undefined}
        />

        {/* Right Side: AI Assistant Chat (40% width or closed) */}
        {isChatOpen && canUseOnlineChat && (
          <DocumentChat
            documentId={documentDetails.id}
            fileName={documentDetails.name}
            status={documentDetails.status}
            onClose={() => setIsChatOpen(false)}
          />
        )}
        <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-3 py-2 shadow-lg">
          <div className="flex flex-col gap-0.5">
            <span className={`font-body-md text-sm ${isOfflineSaved ? 'text-primary' : 'text-secondary'}`}>
              {isOfflineSaved ? 'Available Offline' : isOnline ? 'Online only' : 'Offline'}
            </span>
            {offlineFeedback && (
              <span className={`font-body-md text-xs max-w-[320px] ${
                offlineFeedback.type === 'error'
                  ? 'text-error'
                  : offlineFeedback.type === 'success'
                  ? 'text-primary'
                  : 'text-secondary'
              }`}>
                {offlineFeedback.message}
              </span>
            )}
          </div>
          {isOfflineSaved ? (
            <button
              onClick={handleRemoveOffline}
              disabled={isOfflineActionLoading}
              className="px-3 py-1.5 rounded bg-surface-container-high text-on-surface text-sm hover:bg-surface-container-highest disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isOfflineActionLoading ? 'Removing...' : 'Remove Offline Copy'}
            </button>
          ) : (
            <button
              onClick={handleSaveOffline}
              disabled={isOfflineActionLoading || !isOnline || !documentDetails.id}
              className="px-3 py-1.5 rounded bg-primary text-on-primary text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isOfflineActionLoading ? 'Downloading...' : 'Save Offline'}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FileDetailPage;
