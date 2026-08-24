import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { authApi } from '../../../api/auth.api';
import { RegisterParentRequest, RegisterParentResponse } from '../../../types/auth.types';
import { ROUTES } from '../../../constants/routes';

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: RegisterParentRequest): Promise<RegisterParentResponse> => {
      return authApi.registerParent(payload);
    },
    onSuccess: (data, variables) => {
      // Navigate to OTP verification with non-sensitive identifiers (email, phone)
      // Never pass password through navigation
      router.push({
        pathname: ROUTES.AUTH.OTP as any,
        params: {
          email: variables.email,
          phone: variables.phone,
        },
      });
    },
  });
}
