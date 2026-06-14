import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';

export interface DocumentUploadResponse {
  documentId: number;
  userId: number;
  originalFileName: string;
  s3Key: string;
  contentType: string;
  fileSize: number;
  isPublic: boolean;
  isDeleted: boolean;
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
  }
};
export default documentService;
