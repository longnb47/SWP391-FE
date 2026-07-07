import { documentService } from './documentService';
import { saveOfflineDocument } from '../lib/offlineDocumentDb';
import type { OfflineDocumentRecord } from '../lib/offlineDocumentDb';

export interface SaveOfflineDocumentInput {
  documentId: number;
  userId?: number | null;
  fileName: string;
  contentType: string;
  fileSize: number;
  lastModified: string;
}

export const offlineDocumentService = {
  async saveDocumentForOffline(input: SaveOfflineDocumentInput) {
    const downloadResponse = await documentService.getDocumentDownloadUrl(input.documentId);
    if (!downloadResponse.data?.success) {
      throw new Error(downloadResponse.error || 'Failed to create document download URL.');
    }

    const downloadInfo = downloadResponse.data.data;
    const fileResponse = await fetch(downloadInfo.url);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download document: ${fileResponse.statusText}`);
    }

    const blob = await fileResponse.blob();
    const record: OfflineDocumentRecord = {
      documentId: input.documentId,
      userId: input.userId,
      fileName: input.fileName,
      contentType: blob.type || downloadInfo.contentType || input.contentType,
      fileSize: blob.size || input.fileSize,
      lastModified: input.lastModified,
      savedAt: new Date().toISOString(),
      blob,
    };

    await saveOfflineDocument(record);
    return record;
  },
};

export default offlineDocumentService;
