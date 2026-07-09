import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import SearchInput from '../components/common/SearchInput';
import Button from '../components/common/Button';
import {
  deleteAllOfflineDocuments,
  deleteOfflineDocument,
  getAllOfflineDocuments,
} from '../lib/offlineDocumentDb';
import type { OfflineDocumentRecord } from '../lib/offlineDocumentDb';
import { getFileIconDetails } from '../lib/fileHelpers';

type OfflineSortOption = 'NEWEST' | 'OLDEST' | 'NAME_ASC' | 'NAME_DESC' | 'SIZE_DESC';

const formatBytes = (bytes: number, decimals = 2) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const formatDate = (value?: string) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getFileTypeLabel = (record: OfflineDocumentRecord) => {
  const contentType = record.contentType.toLowerCase();
  const extension = record.fileName.split('.').pop()?.toUpperCase();

  if (contentType === 'application/pdf') return 'PDF';
  if (contentType.startsWith('image/')) return 'Image';
  if (contentType.startsWith('video/')) return 'Video';
  if (contentType.includes('wordprocessingml')) return 'Word Document';
  return extension ? `${extension} file` : 'File';
};

export const OfflineDocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<OfflineDocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<OfflineSortOption>('NEWEST');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const loadOfflineDocuments = async () => {
    setIsLoading(true);
    try {
      const offlineRecords = await getAllOfflineDocuments();
      setRecords(offlineRecords);
    } catch (e) {
      console.error('Failed to load offline documents:', e);
      setFeedback({ type: 'error', message: 'Could not load offline documents from this browser.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOfflineDocuments();
  }, []);

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const visible = query
      ? records.filter((record) => record.fileName.toLowerCase().includes(query))
      : [...records];

    visible.sort((a, b) => {
      if (sortOption === 'OLDEST') {
        return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
      }
      if (sortOption === 'NAME_ASC') {
        return a.fileName.localeCompare(b.fileName);
      }
      if (sortOption === 'NAME_DESC') {
        return b.fileName.localeCompare(a.fileName);
      }
      if (sortOption === 'SIZE_DESC') {
        return b.fileSize - a.fileSize;
      }

      return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });

    return visible;
  }, [records, searchQuery, sortOption]);

  const totalStorageUsed = records.reduce((sum, record) => sum + record.fileSize, 0);

  const handleTabChange = (tabName: string) => {
    if (tabName === 'Offline') return;
    if (tabName !== 'AI Assistant' && tabName !== 'Settings') {
      navigate('/dashboard', { state: { activeTab: tabName } });
    }
  };

  const handleOpenDocument = (record: OfflineDocumentRecord) => {
    navigate(`/document/${record.documentId}`, {
      state: {
        fromTab: 'Offline',
        preferOffline: true,
        offlineUserId: record.userId ?? null,
      },
    });
  };

  const handleDeleteDocument = async (record: OfflineDocumentRecord) => {
    const confirmed = window.confirm(`Delete the offline copy of "${record.fileName}" from this browser?`);
    if (!confirmed) return;

    try {
      await deleteOfflineDocument(record.documentId, record.userId);
      setRecords((current) =>
        current.filter((item) =>
          item.key
            ? item.key !== record.key
            : item.documentId !== record.documentId || item.userId !== record.userId
        )
      );
      setFeedback({ type: 'success', message: `Removed offline copy of "${record.fileName}".` });
    } catch (e) {
      console.error('Failed to delete offline document:', e);
      setFeedback({ type: 'error', message: 'Could not delete this offline document. Try again.' });
    }
  };

  const handleDeleteAll = async () => {
    if (records.length === 0) return;

    const confirmed = window.confirm(`Delete all ${records.length} offline document copies from this browser?`);
    if (!confirmed) return;

    try {
      await deleteAllOfflineDocuments();
      setRecords([]);
      setFeedback({ type: 'success', message: 'All offline document copies were removed.' });
    } catch (e) {
      console.error('Failed to delete all offline documents:', e);
      setFeedback({ type: 'error', message: 'Could not delete all offline documents. Try again.' });
    }
  };

  return (
    <DashboardLayout activeTab="Offline" onTabChange={handleTabChange}>
      <section className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">Offline Documents</h1>
            <p className="font-body-md text-secondary mt-1">
              Manage the document copies saved in this browser.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:min-w-[520px]">
            <div className="rounded-lg border border-outline-variant bg-surface px-4 py-3">
              <p className="font-label-md text-label-md text-secondary">Documents</p>
              <p className="font-title-lg text-title-lg font-bold text-on-surface">{records.length}</p>
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface px-4 py-3">
              <p className="font-label-md text-label-md text-secondary">Storage Used</p>
              <p className="font-title-lg text-title-lg font-bold text-on-surface">{formatBytes(totalStorageUsed)}</p>
            </div>
            <div className="rounded-lg border border-outline-variant bg-surface px-4 py-3">
              <p className="font-label-md text-label-md text-secondary">Visible</p>
              <p className="font-title-lg text-title-lg font-bold text-on-surface">{filteredRecords.length}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchInput
            value={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Search offline documents..."
            className="h-11"
          />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as OfflineSortOption)}
            className="h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/20 md:w-56"
            aria-label="Sort offline documents"
          >
            <option value="NEWEST">Newest first</option>
            <option value="OLDEST">Oldest first</option>
            <option value="NAME_ASC">Name (A-Z)</option>
            <option value="NAME_DESC">Name (Z-A)</option>
            <option value="SIZE_DESC">File size</option>
          </select>
          <Button
            variant="danger"
            leftIcon="delete_sweep"
            onClick={handleDeleteAll}
            disabled={records.length === 0}
            className="md:w-auto"
          >
            Delete All
          </Button>
        </div>

        {feedback && (
          <div className={`rounded-lg border px-4 py-3 font-body-md text-sm ${
            feedback.type === 'error'
              ? 'border-error/30 bg-error-container/20 text-error'
              : feedback.type === 'success'
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-outline-variant bg-surface-container-low text-secondary'
          }`}>
            {feedback.message}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="font-body-md text-secondary">Loading offline documents...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-outline-variant bg-surface py-20 px-6 text-center">
            <span className="material-symbols-outlined text-[52px] text-secondary/60 select-none">offline_pin</span>
            <h2 className="font-title-lg text-title-lg font-bold text-on-surface mt-3">No offline documents yet</h2>
            <p className="font-body-md text-secondary mt-1 max-w-md">
              Open a document while online and choose Save Offline to keep a browser copy here.
            </p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-outline-variant bg-surface py-16 px-6 text-center">
            <span className="material-symbols-outlined text-[44px] text-secondary/60 select-none">manage_search</span>
            <h2 className="font-title-lg text-title-lg font-bold text-on-surface mt-3">No matches</h2>
            <p className="font-body-md text-secondary mt-1">Try a different file name.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="hidden lg:grid grid-cols-[minmax(0,1.8fr)_120px_120px_140px_140px_120px] gap-4 border-b border-outline-variant px-3 pb-2 font-label-md text-label-md text-secondary select-none">
              <span>Name</span>
              <span>Type</span>
              <span>Size</span>
              <span>Saved</span>
              <span>Modified</span>
              <span className="text-right">Actions</span>
            </div>

            {filteredRecords.map((record) => {
              const icon = getFileIconDetails(record.fileName, 'file');
              return (
                <article
                  key={record.key || `${record.userId ?? 'anonymous'}:${record.documentId}`}
                  className="rounded-lg border border-outline-variant bg-surface p-3 lg:grid lg:grid-cols-[minmax(0,1.8fr)_120px_120px_140px_140px_120px] lg:items-center lg:gap-4"
                >
                  <button
                    type="button"
                    onClick={() => handleOpenDocument(record)}
                    className="flex w-full min-w-0 items-center gap-3 text-left cursor-pointer"
                  >
                    <span className={`material-symbols-outlined text-[24px] select-none ${icon.classes}`}>
                      {icon.name}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-body-md text-body-md font-semibold text-on-surface">
                        {record.fileName}
                      </span>
                      <span className="block lg:hidden font-mono-label text-mono-label text-secondary mt-0.5">
                        {getFileTypeLabel(record)} - {formatBytes(record.fileSize)}
                      </span>
                    </span>
                  </button>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm lg:contents lg:mt-0">
                    <div>
                      <span className="block lg:hidden font-label-md text-label-md text-secondary">Type</span>
                      <span className="font-body-md text-body-md text-on-surface">{getFileTypeLabel(record)}</span>
                    </div>
                    <div>
                      <span className="block lg:hidden font-label-md text-label-md text-secondary">Size</span>
                      <span className="font-body-md text-body-md text-on-surface">{formatBytes(record.fileSize)}</span>
                    </div>
                    <div>
                      <span className="block lg:hidden font-label-md text-label-md text-secondary">Saved</span>
                      <span className="font-body-md text-body-md text-on-surface">{formatDate(record.savedAt)}</span>
                    </div>
                    <div>
                      <span className="block lg:hidden font-label-md text-label-md text-secondary">Modified</span>
                      <span className="font-body-md text-body-md text-on-surface">{formatDate(record.lastModified)}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end gap-2 lg:mt-0">
                    <button
                      type="button"
                      onClick={() => handleOpenDocument(record)}
                      className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
                      title="Open offline document"
                    >
                      <span className="material-symbols-outlined text-[20px] select-none">visibility</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(record)}
                      className="p-2 rounded-lg text-secondary hover:text-error hover:bg-error-container/30 transition-colors cursor-pointer"
                      title="Delete offline copy"
                    >
                      <span className="material-symbols-outlined text-[20px] select-none">delete</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default OfflineDocumentsPage;
