import { documentService } from './documentService';
import { saveOfflineDocument } from '../lib/offlineDocumentDb';
import type { OfflineDocumentRecord } from '../lib/offlineDocumentDb';

export type OfflineDocumentErrorCode =
  | 'UNSUPPORTED_TYPE'
  | 'OFFLINE'
  | 'DOWNLOAD_URL_FAILED'
  | 'EXPIRED_URL'
  | 'NETWORK_INTERRUPTED'
  | 'BLOB_FAILED'
  | 'QUOTA_EXCEEDED'
  | 'STORAGE_FAILED';

export class OfflineDocumentError extends Error {
  code: OfflineDocumentErrorCode;

  constructor(code: OfflineDocumentErrorCode, message: string) {
    super(message);
    this.name = 'OfflineDocumentError';
    this.code = code;
  }
}

export interface SaveOfflineDocumentInput {
  documentId: number;
  userId?: number | null;
  fileName: string;
  contentType: string;
  fileSize: number;
  lastModified: string;
}

export const isOfflinePreviewSupported = (fileName: string, contentType: string) => {
  const normalizedType = contentType.toLowerCase();
  const normalizedName = fileName.toLowerCase();

  return (
    normalizedType === 'application/pdf' ||
    normalizedType.startsWith('image/') ||
    normalizedType.startsWith('video/') ||
    normalizedType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    /\.(pdf|png|jpe?g|gif|webp|svg|bmp|docx|mp4|mkv|mov|avi|webm|wmv|flv|3gp|ogg)$/i.test(normalizedName)
  );
};

const isQuotaError = (error: unknown) =>
  error instanceof DOMException &&
  (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');

const isNetworkError = (error: unknown) =>
  error instanceof TypeError ||
  (error instanceof DOMException && error.name === 'AbortError');

export const offlineDocumentService = {
  async saveDocumentForOffline(input: SaveOfflineDocumentInput) {
    if (!navigator.onLine) {
      throw new OfflineDocumentError('OFFLINE', 'Reconnect to the internet before saving this document offline.');
    }

    if (!isOfflinePreviewSupported(input.fileName, input.contentType)) {
      throw new OfflineDocumentError(
        'UNSUPPORTED_TYPE',
        'This file type is not supported for offline preview yet. You can still download it normally.'
      );
    }

    const downloadResponse = await documentService.getDocumentDownloadUrl(input.documentId);
    if (!downloadResponse.data?.success) {
      if (downloadResponse.status === 401 || downloadResponse.status === 403) {
        throw new OfflineDocumentError(
          'EXPIRED_URL',
          'Your secure download link expired or is no longer authorized. Refresh the page and try again.'
        );
      }

      if (
        downloadResponse.status === 500 &&
        downloadResponse.error &&
        /network|fetch|connect|offline/i.test(downloadResponse.error)
      ) {
        throw new OfflineDocumentError(
          'NETWORK_INTERRUPTED',
          'The connection dropped before the download could start. Check your network and try again.'
        );
      }

      throw new OfflineDocumentError(
        'DOWNLOAD_URL_FAILED',
        downloadResponse.error || 'Could not prepare this document for offline saving.'
      );
    }

    const downloadInfo = downloadResponse.data.data;
    let fileResponse: Response;
    try {
      fileResponse = await fetch(downloadInfo.url);
    } catch (error) {
      if (isNetworkError(error)) {
        throw new OfflineDocumentError(
          'NETWORK_INTERRUPTED',
          'The download was interrupted. Check your connection and try saving again.'
        );
      }
      throw error;
    }

    if (!fileResponse.ok) {
      if (fileResponse.status === 401 || fileResponse.status === 403) {
        throw new OfflineDocumentError(
          'EXPIRED_URL',
          'The secure download link expired before the file finished downloading. Try saving again.'
        );
      }

      throw new OfflineDocumentError(
        'NETWORK_INTERRUPTED',
        `The document download failed (${fileResponse.status}). Try again when your connection is stable.`
      );
    }

    let blob: Blob;
    try {
      blob = await fileResponse.blob();
    } catch {
      throw new OfflineDocumentError(
        'BLOB_FAILED',
        'The browser could not prepare this file for offline storage. Try downloading it again.'
      );
    }

    if (!blob || blob.size === 0) {
      throw new OfflineDocumentError(
        'BLOB_FAILED',
        'The downloaded file was empty or unreadable. Try saving it again.'
      );
    }

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

    try {
      await saveOfflineDocument(record);
    } catch (error) {
      if (isQuotaError(error)) {
        throw new OfflineDocumentError(
          'QUOTA_EXCEEDED',
          'Your browser does not have enough storage space for this offline copy. Remove another offline file or free browser storage.'
        );
      }

      throw new OfflineDocumentError(
        'STORAGE_FAILED',
        'The browser could not save this document offline. Try again or check browser storage permissions.'
      );
    }

    return record;
  },
};

export default offlineDocumentService;
