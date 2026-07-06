import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';
import type { BackendResponse } from './documentService';

export interface UserProfileResponse {
  userId: number;
  fullName: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserProfileRequest {
  fullName?: string;
  bio?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export type Theme = 'LIGHT' | 'DARK' | 'SYSTEM';
export type Visibility = 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE';

export interface UserSettingsResponse {
  theme: Theme;
  profileVisibility: Visibility;
  allowFriendRequests: boolean;
  showOnlineStatus: boolean;
  updatedAt: string;
}

export interface UpdateUserSettingsRequest {
  theme?: Theme;
  profileVisibility?: Visibility;
  allowFriendRequests?: boolean;
  showOnlineStatus?: boolean;
}

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
  async getMyProfile(): Promise<ApiResponse<BackendResponse<UserProfileResponse>>> {
    return apiClient.get<BackendResponse<UserProfileResponse>>('/users/me');
  },

  async updateMyProfile(request: UpdateUserProfileRequest): Promise<ApiResponse<BackendResponse<UserProfileResponse>>> {
    return apiClient.request<BackendResponse<UserProfileResponse>>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  },

  async changePassword(request: ChangePasswordRequest): Promise<ApiResponse<BackendResponse<null>>> {
    return apiClient.request<BackendResponse<null>>('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  },

  async uploadAvatar(file: File): Promise<ApiResponse<BackendResponse<UserProfileResponse>>> {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<BackendResponse<UserProfileResponse>>('/users/me/avatar', formData);
  },

  async getMySettings(): Promise<ApiResponse<BackendResponse<UserSettingsResponse>>> {
    return apiClient.get<BackendResponse<UserSettingsResponse>>('/users/me/settings');
  },

  async updateMySettings(request: UpdateUserSettingsRequest): Promise<ApiResponse<BackendResponse<UserSettingsResponse>>> {
    return apiClient.request<BackendResponse<UserSettingsResponse>>('/users/me/settings', {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  },

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
