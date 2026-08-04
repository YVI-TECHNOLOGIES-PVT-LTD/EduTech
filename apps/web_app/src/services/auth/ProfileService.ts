import { apiClient } from '../../lib/api-client';
import { supabase } from '../../lib/supabase';
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
     * Upload an avatar image to Supabase Storage and return the public URL.
     */
    uploadAvatar: async (file: File, userId: string): Promise<string> => {
        const ext = file.name.split('.').pop();
        const filePath = `avatars/${userId}.${ext}`;

        const { error } = await supabase.storage
            .from('school-erp-assets')
            .upload(filePath, file, { upsert: true, contentType: file.type });

        if (error) throw error;

        const { data } = supabase.storage
            .from('school-erp-assets')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    /**
     * Get the active sessions for the current user (placeholder — requires backend support).
     */
    getActiveSessions: async () => {
        try {
            const res = await apiClient.get('/profile/sessions');
            return res.data.sessions ?? [];
        } catch {
            // Backend may not have this endpoint yet
            return [];
        }
    },
};
