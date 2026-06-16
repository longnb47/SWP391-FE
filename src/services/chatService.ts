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

export const chatService = {
  async askQuestion(documentId: number, question: string): Promise<ApiResponse<BackendResponse<AskQuestionResponse>>> {
    return apiClient.post<BackendResponse<AskQuestionResponse>>('/chat/ask', {
      documentId,
      question,
    });
  },
};

export default chatService;
