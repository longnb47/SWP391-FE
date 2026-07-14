import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import FileList from '../components/dashboard/FileList';
import UploadModal from '../components/dashboard/UploadModal';
import { documentService } from '../services/documentService';
import type { DocumentUploadResponse, DocumentFilterSort } from '../services/documentService';
import { tagService } from '../services/tagService';
import type { TagResponse } from '../services/tagService';
import { folderService } from '../services/folderService';
import type { DocumentFolderResponse } from '../services/folderService';
import subscriptionService from '../services/subscriptionService';
import CreateFolderModal from '../components/dashboard/CreateFolderModal';
import RenameModal from '../components/dashboard/RenameModal';
import MoveToFolderModal from '../components/dashboard/MoveToFolderModal';
import FriendsView from '../components/dashboard/FriendsView';
import SettingsView from '../components/dashboard/SettingsView';
import FilterPanel from '../components/dashboard/FilterPanel';
import AiAssistantConfigView from '../components/dashboard/AiAssistantConfigView';
import SmartChatView from '../components/dashboard/SmartChatView';
import ShareModal from '../components/dashboard/ShareModal';
import AdminPlansView from '../components/dashboard/AdminPlansView';
import DocumentChat from '../components/document/DocumentChat';
import { getFileIconDetails } from '../lib/fileHelpers';
import { saveKnownUser, resolveOwnerEmail } from '../lib/userHelpers';
import {
  mockFileItems,
} from '../features/dashboard/dashboard.mock';
import type {
  FileItem,
} from '../features/dashboard/dashboard.mock';

interface DocumentWithTags extends DocumentUploadResponse {
  tags?: string[];
  tagDetails?: { name: string; color: string }[];
}

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
  const location = useLocation();

  // Retrieve navigation state if returning from document detail view
  const navigationState = location.state as {
    activeTab?: string;
    folderId?: number | null;
    folderName?: string | null;
  } | null;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(() => navigationState?.activeTab || 'My Files');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Real API states
  const [apiFiles, setApiFiles] = useState<DocumentWithTags[]>([]);
  const [apiFolders, setApiFolders] = useState<DocumentFolderResponse[]>([]);
  const [allFolders, setAllFolders] = useState<DocumentFolderResponse[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  // Folder navigation state
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(() =>
    navigationState?.folderId !== undefined ? navigationState.folderId : null
  );
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(() =>
    navigationState?.folderName !== undefined ? navigationState.folderName : null
  );

  // Modal states
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [isMoveToOpen, setIsMoveToOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<FileItem | null>(null);

  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ id: number; name: string; isPublic: boolean } | null>(null);

  // Folder chat state
  const [isFolderChatOpen, setIsFolderChatOpen] = useState(false);

  // Document filter state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isFilterModeActive, setIsFilterModeActive] = useState(false);
  const [filterTagIds, setFilterTagIds] = useState<number[]>([]);
  const [filterContentType, setFilterContentType] = useState('');
  const [filterCreatedFrom, setFilterCreatedFrom] = useState('');
  const [filterCreatedTo, setFilterCreatedTo] = useState('');
  const [filterSort, setFilterSort] = useState<DocumentFilterSort>('NEWEST');
  const [filterPage, setFilterPage] = useState(0);
  const [filteredItems, setFilteredItems] = useState<DocumentWithTags[]>([]);
  const [filterPageMeta, setFilterPageMeta] = useState<{ page: number; size: number; totalElements: number; totalPages: number } | null>(null);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<TagResponse[]>([]);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters =
    filterTagIds.length > 0 ||
    filterContentType !== '' ||
    filterCreatedFrom !== '' ||
    filterCreatedTo !== '' ||
    filterSort !== 'NEWEST';

  const isLoggedIn = !!localStorage.getItem('token');

  const [storageLimitGb, setStorageLimitGb] = useState<number>(2);
  const [allMyFilesSize, setAllMyFilesSize] = useState<number>(0);
  const [allSharedFilesSize, setAllSharedFilesSize] = useState<number>(0);

  const fetchStorageData = async () => {
    if (!isLoggedIn) return;
    try {
      const [subRes, myDocsRes, sharedDocsRes] = await Promise.all([
        subscriptionService.getMySubscription().catch(() => null),
        documentService.getMyDocuments().catch(() => null),
        documentService.getSharedWithMeDocuments().catch(() => null),
      ]);

      if (subRes && subRes.data && subRes.data.success && subRes.data.data) {
        setStorageLimitGb(subRes.data.data.storageLimitGb || 2);
      } else {
        setStorageLimitGb(2);
      }

      if (myDocsRes && myDocsRes.data && myDocsRes.data.success && myDocsRes.data.data) {
        const myTotal = myDocsRes.data.data.reduce((sum, f) => sum + (f.fileSize || 0), 0);
        setAllMyFilesSize(myTotal);
      } else {
        setAllMyFilesSize(0);
      }

      if (sharedDocsRes && sharedDocsRes.data && sharedDocsRes.data.success && sharedDocsRes.data.data) {
        const sharedTotal = sharedDocsRes.data.data.reduce((sum, f) => sum + (f.fileSize || 0), 0);
        setAllSharedFilesSize(sharedTotal);
      } else {
        setAllSharedFilesSize(0);
      }
    } catch (e) {
      console.error('Error fetching storage details:', e);
    }
  };

  // Load all folders list for move modal
  const loadAllFolders = async () => {
    try {
      const response = await folderService.getFolders();
      if (response.data && response.data.success) {
        setAllFolders(response.data.data);
      }
    } catch (e) {
      console.error('Failed to load folders list:', e);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadAllFolders();
      fetchStorageData();

      const currentUserId = localStorage.getItem('userId');
      const currentFullName = localStorage.getItem('userFullName');
      const currentEmail = localStorage.getItem('userEmail');
      if (currentUserId && (currentFullName || currentEmail)) {
        saveKnownUser(currentUserId, currentFullName, currentEmail);
      }

      tagService.getTags().then((response) => {
        if (response.data && response.data.success) {
          setAvailableTags(response.data.data);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Close the filter panel on outside click
  useEffect(() => {
    if (!isFilterPanelOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node)) {
        setIsFilterPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterPanelOpen]);

  // Fetch filtered documents (debounced) whenever an active filter/sort/page changes
  useEffect(() => {
    if (!isFilterModeActive || !isLoggedIn) return;

    const timeoutId = setTimeout(async () => {
      setIsFilterLoading(true);
      const response = await documentService.filterMyDocuments({
        tagIds: filterTagIds,
        contentType: filterContentType || undefined,
        createdFrom: filterCreatedFrom ? `${filterCreatedFrom}T00:00:00Z` : undefined,
        createdTo: filterCreatedTo ? `${filterCreatedTo}T23:59:59Z` : undefined,
        sort: filterSort,
        page: filterPage,
        size: 20,
      });

      if (response.data && response.data.success) {
        const pageData = response.data.data;
        const docsWithTags = await Promise.all(
          pageData.documents.map(async (doc) => {
            try {
              const tagResponse = await tagService.getDocumentTags(doc.documentId);
              if (tagResponse.data && tagResponse.data.success) {
                const tagNames = tagResponse.data.data.map((t) => t.name);
                const tagDetails = tagResponse.data.data.map((t) => ({ name: t.name, color: t.color }));
                return { ...doc, tags: tagNames, tagDetails };
              }
            } catch (e) {
              console.error(`Failed to load tags for document ${doc.documentId}:`, e);
            }
            return { ...doc, tags: [], tagDetails: [] };
          })
        );
        setFilteredItems(docsWithTags);
        setFilterPageMeta({
          page: pageData.page,
          size: pageData.size,
          totalElements: pageData.totalElements,
          totalPages: pageData.totalPages,
        });
      } else {
        alert(`Failed to load filtered documents: ${response.error || 'Server error'}`);
        setFilteredItems([]);
        setFilterPageMeta(null);
      }
      setIsFilterLoading(false);
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [isFilterModeActive, filterTagIds, filterContentType, filterCreatedFrom, filterCreatedTo, filterSort, filterPage, isLoggedIn]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setIsFolderChatOpen(currentFolderId !== null);
  }, [currentFolderId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Load files from backend
  const fetchFiles = async () => {
    if (!isLoggedIn) {
      setApiFiles([]);
      setApiFolders([]);
      setIsFallbackMode(false);
      setIsLoadingFiles(false);
      return;
    }
    setIsLoadingFiles(true);
    fetchStorageData();
    
    try {
      if (currentFolderId !== null) {
        // Fetch documents in folder (applicable for both "My Files" and "Starred")
        setApiFolders([]); // No folders inside folders
        const docsResponse = await folderService.getFolderDocuments(currentFolderId);
        
        if (docsResponse.data && docsResponse.data.success) {
          const folderDocs = docsResponse.data.data;
          
          // Fetch tags for folder documents
          const docsWithTags = await Promise.all(
            folderDocs.map(async (doc) => {
              try {
                const tagResponse = await tagService.getDocumentTags(doc.documentId);
                if (tagResponse.data && tagResponse.data.success) {
                  const tagNames = tagResponse.data.data.map((t) => t.name);
                  const tagDetails = tagResponse.data.data.map((t) => ({ name: t.name, color: t.color }));
                  return { ...doc, tags: tagNames, tagDetails };
                }
              } catch (e) {
                console.error(`Failed to load tags for document ${doc.documentId}:`, e);
              }
              return { ...doc, tags: [], tagDetails: [] };
            })
          );
          
          setApiFiles(docsWithTags);
          setIsFallbackMode(false);
        } else {
          console.warn(`Failed to fetch documents for folder ${currentFolderId}`);
          setApiFiles([]);
        }
      } else if (activeTab === 'My Files') {
        // Fetch folders and root documents in parallel
        const [foldersResponse, docsResponse] = await Promise.all([
          folderService.getFolders(),
          documentService.getMyDocuments(),
        ]);
        
        let rootDocs: DocumentUploadResponse[] = [];
        if (docsResponse.data && docsResponse.data.success) {
          // Filter root documents only
          rootDocs = docsResponse.data.data.filter((doc) => doc.folderId === null);
        }
        
        if (foldersResponse.data && foldersResponse.data.success) {
          setApiFolders(foldersResponse.data.data);
        } else {
          setApiFolders([]);
        }
        
        // Fetch tags for root documents
        const docsWithTags = await Promise.all(
          rootDocs.map(async (doc) => {
            try {
              const tagResponse = await tagService.getDocumentTags(doc.documentId);
              if (tagResponse.data && tagResponse.data.success) {
                const tagNames = tagResponse.data.data.map((t) => t.name);
                const tagDetails = tagResponse.data.data.map((t) => ({ name: t.name, color: t.color }));
                return { ...doc, tags: tagNames, tagDetails };
              }
            } catch (e) {
              console.error(`Failed to load tags for document ${doc.documentId}:`, e);
            }
            return { ...doc, tags: [], tagDetails: [] };
          })
        );
        
        setApiFiles(docsWithTags);
        setIsFallbackMode(false);
      } else if (activeTab === 'Starred') {
        const [foldersResponse, docsResponse] = await Promise.all([
          folderService.getStarredFolders(),
          documentService.getStarredDocuments(),
        ]);

        if (foldersResponse.data && foldersResponse.data.success) {
          setApiFolders(foldersResponse.data.data);
        } else {
          setApiFolders([]);
        }

        let starredDocs: DocumentUploadResponse[] = [];
        if (docsResponse.data && docsResponse.data.success) {
          starredDocs = docsResponse.data.data;
        }

        const docsWithTags = await Promise.all(
          starredDocs.map(async (doc) => {
            try {
              const tagResponse = await tagService.getDocumentTags(doc.documentId);
              if (tagResponse.data && tagResponse.data.success) {
                const tagNames = tagResponse.data.data.map((t) => t.name);
                const tagDetails = tagResponse.data.data.map((t) => ({ name: t.name, color: t.color }));
                return { ...doc, tags: tagNames, tagDetails };
              }
            } catch (e) {
              console.error(`Failed to load tags for document ${doc.documentId}:`, e);
            }
            return { ...doc, tags: [], tagDetails: [] };
          })
        );
        setApiFiles(docsWithTags);
        setIsFallbackMode(false);
      } else if (activeTab === 'Community') {
        setApiFolders([]);
        const docsResponse = await documentService.getPublicDocuments();

        let publicDocs: DocumentUploadResponse[] = [];
        if (docsResponse.data && docsResponse.data.success) {
          publicDocs = docsResponse.data.data;
        }

        const docsWithTags = await Promise.all(
          publicDocs.map(async (doc) => {
            try {
              const tagResponse = await tagService.getPublicDocumentTags(doc.documentId);
              if (tagResponse.data && tagResponse.data.success) {
                const tagNames = tagResponse.data.data.map((t) => t.name);
                const tagDetails = tagResponse.data.data.map((t) => ({ name: t.name, color: t.color }));
                return { ...doc, tags: tagNames, tagDetails };
              }
            } catch (e) {
              console.error(`Failed to load tags for document ${doc.documentId}:`, e);
            }
            return { ...doc, tags: [], tagDetails: [] };
          })
        );
        setApiFiles(docsWithTags);
        setIsFallbackMode(false);
      } else if (activeTab === 'Trash') {
        setApiFolders([]);
        const docsResponse = await documentService.getTrashDocuments();

        let trashDocs: DocumentUploadResponse[] = [];
        if (docsResponse.data && docsResponse.data.success) {
          trashDocs = docsResponse.data.data;
        }

        const docsWithTags = await Promise.all(
          trashDocs.map(async (doc) => {
            try {
              const tagResponse = await tagService.getDocumentTags(doc.documentId);
              if (tagResponse.data && tagResponse.data.success) {
                const tagNames = tagResponse.data.data.map((t) => t.name);
                const tagDetails = tagResponse.data.data.map((t) => ({ name: t.name, color: t.color }));
                return { ...doc, tags: tagNames, tagDetails };
              }
            } catch (e) {
              console.error(`Failed to load tags for document ${doc.documentId}:`, e);
            }
            return { ...doc, tags: [], tagDetails: [] };
          })
        );
        setApiFiles(docsWithTags);
        setIsFallbackMode(false);
      } else if (activeTab === 'Shared') {
        setApiFolders([]);
        const docsResponse = await documentService.getSharedWithMeDocuments();

        let sharedDocs: DocumentUploadResponse[] = [];
        if (docsResponse.data && docsResponse.data.success) {
          sharedDocs = docsResponse.data.data;
        }

        const docsWithTags = await Promise.all(
          sharedDocs.map(async (doc) => {
            try {
              const tagResponse = await tagService.getDocumentTags(doc.documentId);
              if (tagResponse.data && tagResponse.data.success) {
                const tagNames = tagResponse.data.data.map((t) => t.name);
                const tagDetails = tagResponse.data.data.map((t) => ({ name: t.name, color: t.color }));
                return { ...doc, tags: tagNames, tagDetails };
              }
            } catch (e) {
              console.error(`Failed to load tags for document ${doc.documentId}:`, e);
            }
            return { ...doc, tags: [], tagDetails: [] };
          })
        );
        setApiFiles(docsWithTags);
        setIsFallbackMode(false);
      } else if (activeTab === 'Friends' || activeTab === 'Settings') {
        setApiFiles([]);
        setApiFolders([]);
        setIsLoadingFiles(false);
        return;
      } else {
        setApiFiles([]);
        setApiFolders([]);
        setIsFallbackMode(false);
      }
    } catch (e) {
      console.warn('API error or server offline. Falling back to local mock data.', e);
      setIsFallbackMode(true);
    }
    setIsLoadingFiles(false);
  };

  useEffect(() => {
    // Reload the visible document list after changing tab/folder and after a successful upload callback.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId, activeTab]);

  // Removed useEffect resetting folder on tab change to allow state preservation.
  // Resets are handled directly in handleTabChange.

  // Map backend files to frontend FileItems
  const mapApiFileToFileItem = (doc: DocumentWithTags): FileItem => {
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
      tags: doc.tags || [],
      owner: resolveOwnerEmail(doc.userId),
      lastModified: new Date(doc.uploadedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      size: formatBytes(doc.fileSize),
      isPublic: doc.isPublic,
      isStarred: doc.isStarred,
      tagDetails: doc.tagDetails || [],
      folderId: doc.folderId,
    };
  };

  // Compile final file list: folders + documents, or mock files filtered by navigation
  const fileItems: FileItem[] = !isLoggedIn
    ? []
    : isFallbackMode
    ? mockFileItems.filter((item) => {
        const itemDeleted = !!item.isDeleted;
        if (activeTab === 'Trash') {
          return itemDeleted && item.type === 'file';
        }
        if (itemDeleted) {
          return false;
        }

        if (currentFolderId !== null) {
          // Inside a folder, show files belonging to this folder (applicable to both My Files and Starred)
          return item.type === 'file' && String(item.folderId) === String(currentFolderId);
        }

        if (activeTab === 'My Files') {
          // At root, show folders and root files
          return item.type.startsWith('folder') || !item.folderId;
        } else if (activeTab === 'Starred') {
          return !!item.isStarred;
        } else if (activeTab === 'Community') {
          return !!item.isPublic && item.type === 'file';
        } else if (activeTab === 'Shared') {
          return item.type === 'file' && item.owner !== 'Me';
        } else if (activeTab === 'Friends') {
          return false;
        }
        return true;
      })
    : [
        ...apiFolders.map((folder) => ({
          id: String(folder.folderId),
          name: folder.name,
          type: 'folder' as const,
          owner: resolveOwnerEmail(folder.userId),
          lastModified: new Date(folder.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          size: '--',
          isStarred: folder.isStarred,
        })),
        ...apiFiles.map(mapApiFileToFileItem),
      ];



  // Calculate dynamic storage usage metrics
  const usedBytes = isLoggedIn && !isFallbackMode
    ? allMyFilesSize + allSharedFilesSize
    : isLoggedIn
    ? 15 * 1024 * 1024 * 1024 // 15GB mock default
    : 0; // 0 Bytes for guests
  
  const totalBytes = isLoggedIn && !isFallbackMode
    ? storageLimitGb * 1024 * 1024 * 1024
    : isLoggedIn
    ? 100 * 1024 * 1024 * 1024 // 100GB mock default
    : 2 * 1024 * 1024 * 1024; // 2GB for guests

  const usedPercentage = Math.min(100, Math.round((usedBytes / totalBytes) * 100));
  const dynamicStorage = {
    usedBytes,
    totalBytes,
    usedPercentage,
    formattedUsed: formatBytes(usedBytes),
    formattedTotal: `${isLoggedIn && !isFallbackMode ? storageLimitGb : isLoggedIn ? 100 : 2} GB`,
  };

  // When document filters are active, they replace the tab-based file list with
  // the caller's own filtered documents (the backend filter endpoint is scoped to
  // "my documents", so folders and other tabs' content don't apply here).
  const filterResultItems: FileItem[] = filteredItems.map(mapApiFileToFileItem);

  // Search filtering
  const filteredFiles = (isFilterModeActive ? filterResultItems : fileItems).filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exitFilterMode = () => {
    setIsFilterModeActive(false);
    setFilteredItems([]);
    setFilterPageMeta(null);
  };

  const handleResetFilters = () => {
    setFilterTagIds([]);
    setFilterContentType('');
    setFilterCreatedFrom('');
    setFilterCreatedTo('');
    setFilterSort('NEWEST');
    setFilterPage(0);
    exitFilterMode();
  };

  const applyFilterChange = () => {
    setFilterPage(0);
    setIsFilterModeActive(true);
  };

  const handleFilterTagsChange = (ids: number[]) => {
    setFilterTagIds(ids);
    applyFilterChange();
  };
  const handleFilterContentTypeChange = (value: string) => {
    setFilterContentType(value);
    applyFilterChange();
  };
  const handleFilterCreatedFromChange = (value: string) => {
    setFilterCreatedFrom(value);
    applyFilterChange();
  };
  const handleFilterCreatedToChange = (value: string) => {
    setFilterCreatedTo(value);
    applyFilterChange();
  };
  const handleFilterSortChange = (value: DocumentFilterSort) => {
    setFilterSort(value);
    applyFilterChange();
  };

  // Trigger S3 File Upload Modal
  const handleTabChange = (tabName: string) => {
    setCurrentFolderId(null);
    setCurrentFolderName(null);
    setActiveTab(tabName);
    setIsFolderChatOpen(false);
    exitFilterMode();
  };

  const handleUploadFile = () => {
    if (!isLoggedIn) {
      // Upload is an authenticated workflow; unauthenticated users are redirected before opening the modal.
      alert('Please log in to upload files.');
      navigate('/login');
      return;
    }
    // The modal receives the current folder so a successful upload can be placed there.
    setIsUploadModalOpen(true);
  };

  const handleNewFolder = () => {
    if (!isLoggedIn) {
      alert('Please log in to create folders.');
      navigate('/login');
      return;
    }
    setIsCreateFolderOpen(true);
  };

  const handleItemClick = (item: FileItem) => {
    if (!isLoggedIn) {
      alert('Please log in to view file details.');
      navigate('/login');
      return;
    }
    if (item.type === 'folder' || item.type === 'folder_shared') {
      setCurrentFolderId(Number(item.id));
      setCurrentFolderName(item.name);
    } else {
      navigate(`/document/${item.id}`, {
        state: {
          fromTab: activeTab,
          fromFolderId: currentFolderId,
          fromFolderName: currentFolderName,
        },
      });
    }
  };



  const handleItemActionClick = async (item: FileItem, action: string) => {
    if (!isLoggedIn) {
      alert('Please log in to perform this action.');
      navigate('/login');
      return;
    }
    if (action === 'delete') {
      if (item.type === 'folder' || item.type === 'folder_shared') {
        alert('Folder deletion is not implemented yet as requested.');
        return;
      }
      const confirmDelete = window.confirm(`Are you sure you want to delete "${item.name}"?`);
      if (!confirmDelete) return;

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
        const mockItem = mockFileItems.find((f) => f.id === item.id);
        if (mockItem) mockItem.isDeleted = true;
        alert(`Mock soft-deleted: ${item.name}`);
        fetchFiles();
      }
    } else if (action === 'restore') {
      const numericId = Number(item.id);
      if (!isNaN(numericId) && !isFallbackMode) {
        setIsLoadingFiles(true);
        const response = await documentService.restoreDocument(numericId);
        if (response.data && response.data.success) {
          alert('Document restored successfully!');
          fetchFiles();
        } else {
          alert(`Failed to restore document: ${response.error || 'Server error'}`);
          setIsLoadingFiles(false);
        }
      } else {
        const mockItem = mockFileItems.find((f) => f.id === item.id);
        if (mockItem) mockItem.isDeleted = false;
        alert(`Mock restored document: ${item.name}`);
        fetchFiles();
      }
    } else if (action === 'delete_permanent') {
      const confirmDelete = window.confirm(`Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`);
      if (!confirmDelete) return;

      const numericId = Number(item.id);
      if (!isNaN(numericId) && !isFallbackMode) {
        setIsLoadingFiles(true);
        const response = await documentService.deleteDocumentPermanently(numericId);
        if (response.data && response.data.success) {
          alert('Document permanently deleted!');
          fetchFiles();
        } else {
          alert(`Failed to delete permanently: ${response.error || 'Server error'}`);
          setIsLoadingFiles(false);
        }
      } else {
        const idx = mockFileItems.findIndex((f) => f.id === item.id);
        if (idx !== -1) mockFileItems.splice(idx, 1);
        alert(`Mock permanently deleted document: ${item.name}`);
        fetchFiles();
      }
    } else if (action === 'rename') {
      setRenameTarget({
        id: item.id,
        name: item.name,
        type: item.type === 'folder' || item.type === 'folder_shared' ? 'folder' : 'file',
      });
      setIsRenameOpen(true);
    } else if (action === 'move_to') {
      setMoveTarget(item);
      setIsMoveToOpen(true);
    } else if (action === 'move_out') {
      const numericId = Number(item.id);
      if (!isNaN(numericId) && !isFallbackMode) {
        setIsLoadingFiles(true);
        const response = await documentService.moveDocumentToFolder(numericId, null);
        if (response.data && response.data.success) {
          alert(`Moved "${item.name}" out of folder successfully.`);
          fetchFiles();
        } else {
          alert(`Failed to move file: ${response.error || 'Server error'}`);
          setIsLoadingFiles(false);
        }
      } else {
        const mockItem = mockFileItems.find(f => f.id === item.id);
        if (mockItem) mockItem.folderId = null;
        alert(`Mock moved "${item.name}" out of folder.`);
        fetchFiles();
      }
    } else if (action === 'toggle_star') {
      const numericId = Number(item.id);
      const newStar = !item.isStarred;
      if (!isNaN(numericId) && !isFallbackMode) {
        setIsLoadingFiles(true);
        let success: boolean;
        let error: string;
        if (item.type === 'folder' || item.type === 'folder_shared') {
          const response = await folderService.starFolder(numericId, newStar);
          success = !!(response.data && response.data.success);
          error = response.error || '';
        } else {
          const response = await documentService.starDocument(numericId, newStar);
          success = !!(response.data && response.data.success);
          error = response.error || '';
        }

        if (success) {
          alert(`${newStar ? 'Starred' : 'Unstarred'} successfully!`);
          fetchFiles();
        } else {
          alert(`Failed to update starred status: ${error || 'Server error'}`);
          setIsLoadingFiles(false);
        }
      } else {
        const mockItem = mockFileItems.find((f) => f.id === item.id);
        if (mockItem) mockItem.isStarred = newStar;
        alert(`Mock toggled star status for: ${item.name}`);
        fetchFiles();
      }
    } else if (action === 'toggle_visibility') {
      const numericId = Number(item.id);
      if (!isNaN(numericId) && !isFallbackMode) {
        setIsLoadingFiles(true);
        const newVisibility = !item.isPublic;
        const response = await documentService.updateDocumentVisibility(numericId, newVisibility);
        if (response.data && response.data.success) {
          alert(`Document visibility changed to ${newVisibility ? 'Public' : 'Private'} successfully!`);
          fetchFiles();
        } else {
          alert(`Failed to update visibility: ${response.error || 'Server error'}`);
          setIsLoadingFiles(false);
        }
      } else {
        const mockItem = mockFileItems.find(f => f.id === item.id);
        if (mockItem) mockItem.isPublic = !mockItem.isPublic;
        alert(`Mock toggled visibility for: ${item.name}`);
        fetchFiles();
      }
    } else if (action === 'share') {
      const numericId = Number(item.id);
      if (!isNaN(numericId)) {
        setShareTarget({
          id: numericId,
          name: item.name,
          isPublic: !!item.isPublic,
        });
        setIsShareModalOpen(true);
      } else {
        alert('Sharing mock items is not supported.');
      }
    } else if (action === 'open') {
      handleItemClick(item);
    }
  };

  // Submit handlers for Modals
  const handleCreateFolderSubmit = async (name: string) => {
    if (!isFallbackMode) {
      setIsLoadingFiles(true);
      const response = await folderService.createFolder(name);
      if (response.data && response.data.success) {
        alert('Folder created successfully!');
        loadAllFolders();
        fetchFiles();
      } else {
        alert(`Failed to create folder: ${response.error || 'Server error'}`);
        setIsLoadingFiles(false);
      }
    } else {
      mockFileItems.push({
        id: 'f_mock_' + (mockFileItems.length + 1),
        name: name,
        type: 'folder',
        owner: 'Me',
        lastModified: 'Just now',
        size: '--',
      });
      alert(`Mock created folder: ${name}`);
      fetchFiles();
    }
  };

  const handleRenameSubmit = async (newName: string) => {
    if (!renameTarget) return;
    
    if (!isFallbackMode) {
      setIsLoadingFiles(true);
      let success: boolean;
      let error: string;
      if (renameTarget.type === 'file') {
        const response = await documentService.renameDocument(Number(renameTarget.id), newName);
        success = !!(response.data && response.data.success);
        error = response.error || '';
      } else {
        const response = await folderService.updateFolder(Number(renameTarget.id), newName);
        success = !!(response.data && response.data.success);
        error = response.error || '';
      }

      if (success) {
        alert('Renamed successfully!');
        loadAllFolders();
        fetchFiles();
      } else {
        alert(`Failed to rename: ${error || 'Server error'}`);
        setIsLoadingFiles(false);
      }
    } else {
      const mockItem = mockFileItems.find(f => f.id === renameTarget.id);
      if (mockItem) {
        mockItem.name = newName;
      }
      alert(`Mock renamed to: ${newName}`);
      fetchFiles();
    }
  };

  const handleMoveToSubmit = async (targetFolderId: number | string | null) => {
    if (!moveTarget) return;

    if (!isFallbackMode) {
      setIsLoadingFiles(true);
      const numericFolderId = targetFolderId === null ? null : Number(targetFolderId);
      const response = await documentService.moveDocumentToFolder(Number(moveTarget.id), numericFolderId);
      if (response.data && response.data.success) {
        alert('Document moved successfully!');
        fetchFiles();
      } else {
        alert(`Failed to move document: ${response.error || 'Server error'}`);
        setIsLoadingFiles(false);
      }
    } else {
      const mockItem = mockFileItems.find(f => f.id === moveTarget.id);
      if (mockItem) {
        mockItem.folderId = targetFolderId ? String(targetFolderId) : null;
      }
      alert(`Mock moved document to folder ID: ${targetFolderId || 'Root'}`);
      fetchFiles();
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onSearch={setSearchQuery}
      onUploadClick={handleUploadFile}
      onNewFolderClick={handleNewFolder}
      storage={dynamicStorage}
    >
      {activeTab === 'Friends' ? (
        <FriendsView />
      ) : activeTab === 'Settings' ? (
        <SettingsView />
      ) : activeTab === 'AI Assistant' ? (
        <AiAssistantConfigView />
      ) : activeTab === 'Smart Chat' ? (
        <SmartChatView />
      ) : activeTab === 'Admin' ? (
        <AdminPlansView />
      ) : (
        /* Main File List / Grid Section */
        <section className="space-y-4">
        {/* Section Header with View Toggles */}
        <div className="flex items-center justify-between">
          <div className="font-headline-lg text-headline-lg font-bold text-on-surface select-none">
            {searchQuery ? (
              `Search Results for "${searchQuery}"`
            ) : isFilterModeActive ? (
              'Filtered results'
            ) : (
              <div className="flex items-center gap-1.5">
                <span
                  onClick={() => {
                    setCurrentFolderId(null);
                    setCurrentFolderName(null);
                  }}
                  className="cursor-pointer hover:text-primary transition-colors font-bold text-on-surface"
                >
                  {activeTab}
                </span>
                {currentFolderName && (
                  <>
                    <span className="text-secondary select-none font-normal">/</span>
                    <span className="text-secondary truncate max-w-[200px]" title={currentFolderName}>
                      {currentFolderName}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 select-none">
            {currentFolderId !== null && (
              <button
                onClick={() => setIsFolderChatOpen(!isFolderChatOpen)}
                className={`p-2.5 rounded-lg transition-colors border cursor-pointer flex items-center gap-1.5 ${
                  isFolderChatOpen
                    ? 'text-tertiary bg-tertiary-fixed/30 border-tertiary/20'
                    : 'text-secondary hover:bg-surface-container-high border-transparent hover:border-outline-variant'
                }`}
                title="Chat with Folder"
              >
                <span className="material-symbols-outlined text-[20px] select-none">smart_toy</span>
                <span className="text-label-md font-bold hidden sm:inline select-none">Folder Chat</span>
              </button>
            )}

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
            
            <div ref={filterPanelRef} className="relative">
              <button
                onClick={() => setIsFilterPanelOpen((open) => !open)}
                className={`p-2 rounded-lg transition-colors border cursor-pointer ml-2 ${
                  isFilterModeActive
                    ? 'text-primary bg-primary-fixed/30 border-primary/20'
                    : 'text-secondary hover:bg-surface-container-high border-transparent hover:border-outline-variant'
                }`}
                title="Filter documents"
              >
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
              </button>

              {isFilterPanelOpen && (
                <FilterPanel
                  availableTags={availableTags}
                  selectedTagIds={filterTagIds}
                  onTagsChange={handleFilterTagsChange}
                  contentType={filterContentType}
                  onContentTypeChange={handleFilterContentTypeChange}
                  createdFrom={filterCreatedFrom}
                  onCreatedFromChange={handleFilterCreatedFromChange}
                  createdTo={filterCreatedTo}
                  onCreatedToChange={handleFilterCreatedToChange}
                  sort={filterSort}
                  onSortChange={handleFilterSortChange}
                  onReset={handleResetFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Layout switching */}
        <div className="flex gap-4 items-start">
          <div className="flex-1 min-w-0">
            {viewMode === 'list' ? (
              <FileList
                items={filteredFiles}
                isLoading={isFilterModeActive ? isFilterLoading : isLoadingFiles}
                onItemClick={handleItemClick}
                onItemActionClick={handleItemActionClick}
                isTrash={activeTab === 'Trash'}
                isCommunity={activeTab === 'Community'}
                emptyTitle={isFilterModeActive ? 'No documents match your filters' : undefined}
                emptyDescription={isFilterModeActive ? 'Try adjusting or resetting your filters.' : undefined}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFiles.map((file) => {
                  const iconInfo = getFileIconDetails(file.name, file.type);
                  return (
                    <div
                      key={file.id}
                      onClick={() => handleItemClick(file)}
                      className="group bg-surface rounded-xl border border-surface-variant p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0px_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 cursor-pointer flex flex-col justify-between h-40 relative"
                    >
                      <div className="flex justify-between items-start">
                        <span 
                          className={`material-symbols-outlined text-display-lg icon-fill select-none ${iconInfo.classes}`}
                        >
                          {iconInfo.name}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          {/* Visibility indicator in Grid View */}
                          {file.type === 'file' && (
                            <span 
                              className="text-secondary material-symbols-outlined text-[16px] select-none mr-1"
                              title={file.isPublic ? 'Public Document' : 'Private Document'}
                            >
                              {file.isPublic ? 'public' : 'lock'}
                            </span>
                          )}
                          
                          {activeTab === 'Trash' ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleItemActionClick(file, 'restore');
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-secondary hover:text-primary rounded transition-opacity cursor-pointer select-none"
                                title="Restore"
                              >
                                <span className="material-symbols-outlined text-[18px]">restore</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleItemActionClick(file, 'delete_permanent');
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-secondary hover:text-error rounded transition-opacity cursor-pointer select-none"
                                title="Delete Permanently"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                              </button>
                            </>
                          ) : activeTab === 'Community' ? (
                            null
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemActionClick(file, 'delete');
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-secondary hover:text-error rounded transition-opacity cursor-pointer select-none"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
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

            {isFilterModeActive && filterPageMeta && filterPageMeta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 select-none">
                <span className="font-body-md text-secondary text-sm">
                  Page {filterPageMeta.page + 1} of {filterPageMeta.totalPages} ({filterPageMeta.totalElements} documents)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={filterPage === 0}
                    onClick={() => setFilterPage((p) => Math.max(0, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-outline-variant text-secondary hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={filterPage + 1 >= filterPageMeta.totalPages}
                    onClick={() => setFilterPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-outline-variant text-secondary hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {isFolderChatOpen && currentFolderId !== null && (
            <div className="w-[480px] shrink-0 bg-surface border border-surface-variant rounded-2xl overflow-hidden shadow-lg h-[calc(100vh-180px)] min-h-[450px] animate-in slide-in-from-right duration-250">
              <DocumentChat
                isFolderMode={true}
                folderId={currentFolderId}
                folderName={currentFolderName || 'Folder'}
                documentIds={apiFiles.filter((f) => f.status === 'READY').map((f) => f.documentId)}
                documents={apiFiles.map((f) => ({ documentId: f.documentId, originalFileName: f.originalFileName }))}
                onClose={() => setIsFolderChatOpen(false)}
              />
            </div>
          )}
        </div>
      </section>
      )}
      
      <UploadModal
      {/* Refresh the dashboard state after the modal finishes upload, tagging and optional folder placement. */}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={fetchFiles}
        folderId={currentFolderId}
      />

      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onCreate={handleCreateFolderSubmit}
      />

      <RenameModal
        isOpen={isRenameOpen}
        onClose={() => {
          setIsRenameOpen(false);
          setRenameTarget(null);
        }}
        currentName={renameTarget?.name || ''}
        itemType={renameTarget?.type || 'file'}
        onRename={handleRenameSubmit}
      />

      <MoveToFolderModal
        isOpen={isMoveToOpen}
        onClose={() => {
          setIsMoveToOpen(false);
          setMoveTarget(null);
        }}
        folders={allFolders.map((f) => ({ folderId: f.folderId, name: f.name }))}
        currentFolderId={moveTarget?.folderId}
        onMove={handleMoveToSubmit}
      />

      {shareTarget && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareTarget(null);
            fetchFiles();
          }}
          documentId={shareTarget.id}
          documentName={shareTarget.name}
          isInitiallyPublic={shareTarget.isPublic}
          onVisibilityChange={(isPublic) => {
            setShareTarget((prev) => prev ? { ...prev, isPublic } : null);
          }}
        />
      )}
    </DashboardLayout>
  );
};
export default DashboardPage;
