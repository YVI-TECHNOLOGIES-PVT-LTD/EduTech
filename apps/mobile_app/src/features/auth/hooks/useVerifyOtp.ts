import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { authApi } from '../../../api/auth.api';
import { VerifyOtpRequest, VerifyOtpResponse } from '../../../types/auth.types';
import { ROUTES } from '../../../constants/routes';

export function useVerifyOtp() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
      return authApi.verifyOtp(payload);
    },
    onSuccess: (data, variables) => {
      // Navigate to login upon successful verification
      router.replace({
        pathname: ROUTES.AUTH.LOGIN as any,
        params: {
          verifiedEmail: variables.email,
          verified: 'true',
        },
      });
    },
  });
}
