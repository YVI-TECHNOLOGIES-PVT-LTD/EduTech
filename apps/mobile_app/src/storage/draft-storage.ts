import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_PREFIX = 'edutrack_app_draft_';

export const DraftStorage = {
  getDraftKey(userId: string, applicationId?: string): string {
    return applicationId
      ? `${DRAFT_PREFIX}${userId}_${applicationId}`
      : `${DRAFT_PREFIX}${userId}_new`;
  },

  async getDraft<T>(userId: string, applicationId?: string): Promise<T | null> {
    try {
      const key = this.getDraftKey(userId, applicationId);
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn('[DraftStorage] Error loading draft:', error);
      return null;
    }
  },

  async saveDraft<T>(userId: string, data: T, applicationId?: string): Promise<void> {
    try {
      const key = this.getDraftKey(userId, applicationId);
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('[DraftStorage] Error saving draft:', error);
    }
  },

  async clearDraft(userId: string, applicationId?: string): Promise<void> {
    try {
      const key = this.getDraftKey(userId, applicationId);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('[DraftStorage] Error clearing draft:', error);
    }
  },

  async clearAllDraftsForUser(userId: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const userDraftKeys = keys.filter((k) => k.startsWith(`${DRAFT_PREFIX}${userId}`));
      if (userDraftKeys.length > 0) {
        await AsyncStorage.multiRemove(userDraftKeys);
      }
    } catch (error) {
      console.warn('[DraftStorage] Error clearing user drafts:', error);
    }
  },
};
