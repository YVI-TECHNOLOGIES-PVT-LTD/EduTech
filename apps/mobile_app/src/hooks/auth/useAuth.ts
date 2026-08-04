import { useAuthStore } from '../../stores/auth.store';
import { AuthService } from '../../core/auth/auth.service';

export const useAuth = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const tokens = useAuthStore((state) => state.tokens);

  return {
    isAuthenticated,
    user,
    tokens,
    loginSuccess: AuthService.loginSuccess,
    logout: AuthService.logout,
  };
};
