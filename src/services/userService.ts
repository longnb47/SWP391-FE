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
};

export default userService;
