import { SecureStorageService } from '../storage/secure-store';
import { STORAGE_KEYS } from '../../constants/storage-keys';
import { AuthTokens } from '../../types';

export class TokenManager {
  static async saveTokens(tokens: AuthTokens): Promise<void> {
    await SecureStorageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    await SecureStorageService.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  }

  static async getAccessToken(): Promise<string | null> {
    return await SecureStorageService.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  static async getRefreshToken(): Promise<string | null> {
    return await SecureStorageService.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  static async clearTokens(): Promise<void> {
    await SecureStorageService.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await SecureStorageService.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
}
