import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../auth/auth.service';

export const useLogout = () => {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async () => {
    setIsPending(true);
    try {
      await AuthService.logout();
    } catch (error: any) {
      console.error('[useLogout] Logout failed:', error.message);
    } finally {
      setIsPending(false);
      navigate('/login');
    }
  };

  return {
    mutateAsync,
    mutate: mutateAsync,
    isPending,
    isLoading: isPending,
  };
};
