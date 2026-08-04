import { apiClient } from '../../lib/api-client';

export interface SchoolAnnouncement {
    id: string;
    title: string;
    body: string;
    category: string;
    targetRoles: string[];
    isPinned: boolean;
    publishedAt: string;
    expiresAt?: string;
    author: string;
}

export const AnnouncementService = {
    /**
     * Fetch latest school announcements for the current user's role.
     */
    getAnnouncements: async (limit = 10): Promise<SchoolAnnouncement[]> => {
        const res = await apiClient.get('/announcements', { params: { limit } });
        return res.data.announcements ?? [];
    },

    /**
     * Fetch pinned announcements (shown on dashboard).
     */
    getPinnedAnnouncements: async (): Promise<SchoolAnnouncement[]> => {
        const res = await apiClient.get('/announcements/pinned');
        return res.data.announcements ?? [];
    },

    /**
     * Fetch a single announcement by ID.
     */
    getAnnouncement: async (id: string): Promise<SchoolAnnouncement> => {
        const res = await apiClient.get(`/announcements/${id}`);
        return res.data.announcement;
    },
};
