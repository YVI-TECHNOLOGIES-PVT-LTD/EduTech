import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const useLogout = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async () => {
    setIsPending(true);
    try {
      await signOut();
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

