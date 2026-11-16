import { useAuth } from '../../context/AuthContext';

export const useCurrentUser = () => {
  const { user, loading, isAuthenticated, refreshProfile } = useAuth();

  return {
    user,
    loading,
    isAuthenticated,
    serverUser: user,
    isLoadingServer: loading,
    refetch: refreshProfile,
  };
};
