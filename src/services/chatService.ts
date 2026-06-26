import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';
import type { BackendResponse } from './documentService';

export interface ChatSource {
  chunkId: number;
  chunkIndex: number;
  pageNumber: number | null;
  score: number;
}

export interface AskQuestionResponse {
  documentId: number;
  answer: string;
  sources: ChatSource[];
}

export interface AskMultiQuestionResponse {
  answer: string;
  mode: string;
  policy: string;
  usedDocumentIds: number[];
}

export const chatService = {
  async askQuestion(documentId: number, question: string): Promise<ApiResponse<BackendResponse<AskQuestionResponse>>> {
    return apiClient.post<BackendResponse<AskQuestionResponse>>('/chat/ask', {
      documentId,
      question,
    });
  },

  async askMultiQuestion(payload: {
    mode: 'SelectedDocuments' | 'UserStorage';
    selectedDocumentIds: number[] | null;
    folderId?: number | null;
    question: string;
    useGeneralKnowledge?: boolean | null;
  }): Promise<ApiResponse<BackendResponse<AskMultiQuestionResponse>>> {
    return apiClient.post<BackendResponse<AskMultiQuestionResponse>>('/chat/ask-multi', payload);
  },
};

export default chatService;
