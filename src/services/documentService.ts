import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';

export interface DocumentUploadResponse {
  documentId: number;
  userId: number;
  folderId: number | null;
  originalFileName: string;
  s3Key: string;
  contentType: string;
  fileSize: number;
  isPublic: boolean;
  isDeleted: boolean;
  isStarred: boolean;
  status: 'UPLOADED' | 'PARSING' | 'INDEXING' | 'READY' | 'FAILED';
  uploadedAt: string;
  deletedAt: string | null;
}

export interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
  timestamp: string;
}

export interface DocumentUrlResponse {
  url: string;
  expiresAt: string;
  fileName: string;
  contentType: string;
}

export const documentService = {
  async getMyDocuments(): Promise<ApiResponse<BackendResponse<DocumentUploadResponse[]>>> {
    return apiClient.get<BackendResponse<DocumentUploadResponse[]>>('/documents/my');
  },

  async uploadDocument(file: File, isPublic = false): Promise<ApiResponse<BackendResponse<DocumentUploadResponse>>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPublic', String(isPublic));
    return apiClient.post<BackendResponse<DocumentUploadResponse>>('/documents/upload', formData);
  },

  async getDocumentDetail(documentId: number): Promise<ApiResponse<BackendResponse<DocumentUploadResponse>>> {
    return apiClient.get<BackendResponse<DocumentUploadResponse>>(`/documents/${documentId}`);
  },

  async deleteDocument(documentId: number): Promise<ApiResponse<BackendResponse<DocumentUploadResponse>>> {
    return apiClient.delete<BackendResponse<DocumentUploadResponse>>(`/documents/${documentId}`);
  },

  async getTrashDocuments(): Promise<ApiResponse<BackendResponse<DocumentUploadResponse[]>>> {
    return apiClient.get<BackendResponse<DocumentUploadResponse[]>>('/documents/trash');
  },

  async restoreDocument(documentId: number): Promise<ApiResponse<BackendResponse<DocumentUploadResponse>>> {
    return apiClient.post<BackendResponse<DocumentUploadResponse>>(`/documents/${documentId}/restore`);
  },

  async deleteDocumentPermanently(documentId: number): Promise<ApiResponse<BackendResponse<null>>> {
    return apiClient.delete<BackendResponse<null>>(`/documents/${documentId}/permanent`);
  },

  async updateDocumentVisibility(documentId: number, isPublic: boolean): Promise<ApiResponse<BackendResponse<DocumentUploadResponse>>> {
    return apiClient.request<BackendResponse<DocumentUploadResponse>>(
      `/documents/${documentId}/visibility?isPublic=${isPublic}`,
      { method: 'PATCH' }
    );
  },

  async getDocumentPreviewUrl(documentId: number): Promise<ApiResponse<BackendResponse<DocumentUrlResponse>>> {
    return apiClient.get<BackendResponse<DocumentUrlResponse>>(`/documents/${documentId}/preview-url`);
  },

  async getDocumentDownloadUrl(documentId: number): Promise<ApiResponse<BackendResponse<DocumentUrlResponse>>> {
    return apiClient.get<BackendResponse<DocumentUrlResponse>>(`/documents/${documentId}/download-url`);
  },

  async renameDocument(documentId: number, name: string): Promise<ApiResponse<BackendResponse<DocumentUploadResponse>>> {
    return apiClient.request<BackendResponse<DocumentUploadResponse>>(
      `/documents/${documentId}/rename`,
      {
        method: 'PATCH',
        body: JSON.stringify({ originalFileName: name })
      }
    );
  },

  async moveDocumentToFolder(documentId: number, folderId: number | null): Promise<ApiResponse<BackendResponse<DocumentUploadResponse>>> {
    return apiClient.request<BackendResponse<DocumentUploadResponse>>(
      `/documents/${documentId}/folder`,
      {
        method: 'PATCH',
        body: JSON.stringify({ folderId })
      }
    );
  },

  async getStarredDocuments(): Promise<ApiResponse<BackendResponse<DocumentUploadResponse[]>>> {
    return apiClient.get<BackendResponse<DocumentUploadResponse[]>>('/documents/starred');
  },

  async starDocument(documentId: number, isStarred: boolean): Promise<ApiResponse<BackendResponse<DocumentUploadResponse>>> {
    return apiClient.request<BackendResponse<DocumentUploadResponse>>(
      `/documents/${documentId}/star?isStarred=${isStarred}`,
      { method: 'PATCH' }
    );
  },

  async getPublicDocuments(): Promise<ApiResponse<BackendResponse<DocumentUploadResponse[]>>> {
    return apiClient.get<BackendResponse<DocumentUploadResponse[]>>('/documents/public');
  },

  async getPublicDocumentDetail(documentId: number): Promise<ApiResponse<BackendResponse<DocumentUploadResponse>>> {
    return apiClient.get<BackendResponse<DocumentUploadResponse>>(`/documents/public/${documentId}`);
  },

  async getPublicDocumentPreviewUrl(documentId: number): Promise<ApiResponse<BackendResponse<DocumentUrlResponse>>> {
    return apiClient.get<BackendResponse<DocumentUrlResponse>>(`/documents/public/${documentId}/preview-url`);
  },

  async getPublicDocumentDownloadUrl(documentId: number): Promise<ApiResponse<BackendResponse<DocumentUrlResponse>>> {
    return apiClient.get<BackendResponse<DocumentUrlResponse>>(`/documents/public/${documentId}/download-url`);
  }
};
export default documentService;
