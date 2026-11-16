import { SecureStorage } from '../../storage/secure-store';
import { useAuthStore } from '../../stores/auth.store';
import { UserProfile, AuthTokens } from '../../types/auth.types';

export class AuthService {
  static async loginSuccess(user: UserProfile, tokens: AuthTokens): Promise<void> {
    if (tokens.accessToken) {
      await SecureStorage.setAccessToken(tokens.accessToken);
    }
    if (tokens.refreshToken) {
      await SecureStorage.setRefreshToken(tokens.refreshToken);
    }
    useAuthStore.getState().setAuth(user, tokens);
  }

  static async logout(): Promise<void> {
    await SecureStorage.clearSession();
    useAuthStore.getState().logout();
  }

  static isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated;
  }
}
