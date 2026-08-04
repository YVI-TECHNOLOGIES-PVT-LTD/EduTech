import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'edutrack_access_token';
const REFRESH_TOKEN_KEY = 'edutrack_refresh_token';
const WORKSPACE_KEY = 'edutrack_workspace_id';

export const SecureStorageService = {
  async setAccessToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  },

  async getAccessToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setWorkspaceId(workspaceId: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(WORKSPACE_KEY, workspaceId);
    } else {
      await SecureStore.setItemAsync(WORKSPACE_KEY, workspaceId);
    }
  },

  async getWorkspaceId(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(WORKSPACE_KEY);
    }
    return await SecureStore.getItemAsync(WORKSPACE_KEY);
  },

  async clearSession(): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(WORKSPACE_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(WORKSPACE_KEY);
    }
  },
};
