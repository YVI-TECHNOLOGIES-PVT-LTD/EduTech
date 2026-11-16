import { apiClient } from '../../lib/api-client';
import type { EnrichedUser } from '../../types/auth';

export const ProfileService = {
  /**
   * Fetch the current user's full enriched profile from the backend.
   */
  getProfile: async (): Promise<EnrichedUser> => {
    const res = await apiClient.get('/me');
    return res.data.user;
  },

  /**
   * Update editable profile fields (full_name, phone_number, etc.).
   */
  updateProfile: async (data: Partial<Pick<EnrichedUser, 'full_name' | 'phone_number'>>) => {
    const res = await apiClient.patch('/profile', data);
    return res.data;
  },

  /**
   * Upload current user's profile photo to the backend via POST /v1/users/me/avatar
   */
  uploadAvatar: async (file: File): Promise<{ user_id: string; avatar_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post('/v1/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data;
  },

  /**
   * Delete current user's profile photo via DELETE /v1/users/me/avatar
   */
  deleteAvatar: async (): Promise<{ user_id: string; avatar_url: null }> => {
    const res = await apiClient.delete('/v1/users/me/avatar');
    return res.data;
  },

  /**
   * Staff/Admin upload profile photo for a target user via POST /v1/users/:id/avatar
   */
  uploadUserAvatarById: async (
    userId: string,
    file: File,
  ): Promise<{ user_id: string; avatar_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiClient.post(`/v1/users/${userId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data;
  },

  /**
   * Staff/Admin delete profile photo for a target user via DELETE /v1/users/:id/avatar
   */
  deleteUserAvatarById: async (userId: string): Promise<{ user_id: string; avatar_url: null }> => {
    const res = await apiClient.delete(`/v1/users/${userId}/avatar`);
    return res.data;
  },

  /**
   * Get active sessions for the current user.
   */
  getActiveSessions: async () => {
    try {
      const res = await apiClient.get('/profile/sessions');
      return res.data.sessions ?? [];
    } catch {
      return [];
    }
  },
};
