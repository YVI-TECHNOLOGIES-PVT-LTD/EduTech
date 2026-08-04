import { TokenManager } from './token-manager';
import { useAuthStore } from '../../stores/auth.store';
import { UserProfile, AuthTokens } from '../../types';

export class AuthService {
  static async loginSuccess(user: UserProfile, tokens: AuthTokens): Promise<void> {
    await TokenManager.saveTokens(tokens);
    useAuthStore.getState().setAuth(user, tokens);
  }

  static async logout(): Promise<void> {
    await TokenManager.clearTokens();
    useAuthStore.getState().logout();
  }

  static isAuthenticated(): boolean {
    return useAuthStore.getState().isAuthenticated;
  }
}
