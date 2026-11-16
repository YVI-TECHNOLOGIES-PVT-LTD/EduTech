import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../auth/auth.service';

interface LoginCredentials {
  email: string;
  password: string;
  redirectTo?: string;
}

export const useLogin = () => {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async ({ email, password, redirectTo }: LoginCredentials) => {
    setIsPending(true);
    try {
      const data = await AuthService.login(email, password);
      navigate(redirectTo ?? '/app');
      return data;
    } catch (error: any) {
      console.error('[useLogin] Login failed:', error.message);
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return {
    mutateAsync,
    mutate: mutateAsync,
    isPending,
    isLoading: isPending,
  };
};
