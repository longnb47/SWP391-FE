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
  model?: string;
  temperature?: number;
}

export interface AskMultiQuestionResponse {
  answer: string;
  mode: string;
  policy: string;
  usedDocumentIds: number[];
  model?: string;
  temperature?: number;
}

export const chatService = {
  async askQuestion(
    documentId: number, 
    question: string,
    model?: string | null,
    temperature?: number | null
  ): Promise<ApiResponse<BackendResponse<AskQuestionResponse>>> {
    return apiClient.post<BackendResponse<AskQuestionResponse>>('/chat/ask', {
      documentId,
      question,
      model,
      temperature,
    });
  },

  async askMultiQuestion(payload: {
    mode: 'SelectedDocuments' | 'UserStorage';
    selectedDocumentIds: number[] | null;
    folderId?: number | null;
    question: string;
    useGeneralKnowledge?: boolean | null;
    model?: string | null;
    temperature?: number | null;
  }): Promise<ApiResponse<BackendResponse<AskMultiQuestionResponse>>> {
    return apiClient.post<BackendResponse<AskMultiQuestionResponse>>('/chat/ask-multi', payload);
  },
};

export default chatService;
