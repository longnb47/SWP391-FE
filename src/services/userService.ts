import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';
import type { BackendResponse } from './documentService';

export interface UserDetail {
  id: number;
  fullName: string;
  email: string;
  role: 'USER' | 'ADMIN';
  planName: string;
  storageUsedGb: number;
  storageLimitGb: number;
  status: 'ACTIVE' | 'BLOCKED';
  joinedAt: string;
}

export const userService = {
  async getAllUsers(): Promise<ApiResponse<BackendResponse<UserDetail[]>>> {
    return apiClient.get<BackendResponse<UserDetail[]>>('/admin/users');
  },

  async updateUserRole(userId: number, role: 'USER' | 'ADMIN'): Promise<ApiResponse<BackendResponse<null>>> {
    return apiClient.put<BackendResponse<null>>(`/admin/users/${userId}/role`, { role });
  },

  async updateUserStatus(userId: number, status: 'ACTIVE' | 'BLOCKED'): Promise<ApiResponse<BackendResponse<null>>> {
    return apiClient.put<BackendResponse<null>>(`/admin/users/${userId}/status`, { status });
  }
};

export default userService;
