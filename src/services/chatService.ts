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

export interface ChatSession {
  sessionId: number;
  title: string;
  mode: 'SELECTED_DOCUMENTS' | 'USER_STORAGE';
  folderId: number | null;
  policy: string;
  model: string;
  temperature: number;
  selectedDocumentIds: number[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageSource {
  documentId: number;
  chunkId: number;
  pageNumber: number | null;
  score: number;
}

export interface ChatMessageFromBackend {
  messageId: number;
  role: 'USER' | 'ASSISTANT';
  content: string;
  status: 'COMPLETED' | 'FAILED';
  createdAt: string;
  sources: MessageSource[];
}

export interface SessionMessagesResponse {
  messages: ChatMessageFromBackend[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
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

  async createSession(payload: {
    title?: string;
    mode: 'SelectedDocuments' | 'UserStorage';
    selectedDocumentIds?: number[] | null;
    folderId?: number | null;
    useGeneralKnowledge?: boolean | null;
    model?: string | null;
    temperature?: number | null;
  }): Promise<ApiResponse<BackendResponse<ChatSession>>> {
    return apiClient.post<BackendResponse<ChatSession>>('/chat/sessions', payload);
  },

  async getSessions(): Promise<ApiResponse<BackendResponse<ChatSession[]>>> {
    return apiClient.get<BackendResponse<ChatSession[]>>('/chat/sessions');
  },

  async renameSession(sessionId: number, title: string): Promise<ApiResponse<BackendResponse<ChatSession>>> {
    return apiClient.request<BackendResponse<ChatSession>>(
      `/chat/sessions/${sessionId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      }
    );
  },

  async deleteSession(sessionId: number): Promise<ApiResponse<BackendResponse<null>>> {
    return apiClient.delete<BackendResponse<null>>(`/chat/sessions/${sessionId}`);
  },

  async getSessionMessages(sessionId: number, page = 0, size = 50): Promise<ApiResponse<BackendResponse<SessionMessagesResponse>>> {
    return apiClient.get<BackendResponse<SessionMessagesResponse>>(`/chat/sessions/${sessionId}/messages?page=${page}&size=${size}`);
  },

  async sendMessageToSession(sessionId: number, question: string): Promise<ApiResponse<BackendResponse<{ answer: string; model: string; temperature: number; usedDocumentIds: number[] }>>> {
    return apiClient.post<BackendResponse<{ answer: string; model: string; temperature: number; usedDocumentIds: number[] }>>(
      `/chat/sessions/${sessionId}/messages`,
      { question }
    );
  },
};

export default chatService;
