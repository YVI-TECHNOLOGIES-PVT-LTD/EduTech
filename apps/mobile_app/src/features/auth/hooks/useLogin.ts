import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { authApi } from '../../../api/auth.api';
import { LoginRequest, LoginResponse } from '../../../types/auth.types';
import { useAuthStore } from '../../../stores/auth.store';
import { ROUTES } from '../../../constants/routes';
import { ApiError } from '../../../api/client';

export function isParentUser(user: LoginResponse['user']): boolean {
  if (!user) return false;
  const roles = user.roles || (user.role ? [String(user.role)] : []);
  return roles.some((r) => r.toUpperCase() === 'PARENT');
}

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
      const response = await authApi.login(credentials);

      // Parent Role Enforcement (Rule 9)
      if (!isParentUser(response.user)) {
        await authApi.logout();
        throw new ApiError(
          403,
          'Access Denied: The mobile app is reserved for Parent accounts. Please log in through the Web Portal for staff administration.',
          'PARENT_ROLE_REQUIRED',
        );
      }

      return response;
    },
    onSuccess: (data) => {
      setAuth(data.user, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      });
      router.replace(ROUTES.PARENT.DASHBOARD as any);
    },
  });
}
