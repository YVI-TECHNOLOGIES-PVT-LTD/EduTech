import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { ProfileService } from '../../services/auth/ProfileService';

/**
 * Returns the enriched current user from AuthContext (instant, no network).
 * Also exposes a refetch() and a fresh server-validated version via TanStack Query.
 */
export const useCurrentUser = () => {
    const { user, loading, isAuthenticated } = useAuth();

    const query = useQuery({
        queryKey: ['currentUser'],
        queryFn: ProfileService.getProfile,
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    });

    return {
        // From AuthContext (already hydrated — use for fast reads)
        user,
        loading,
        isAuthenticated,
        // From TanStack Query (server-validated)
        serverUser: query.data,
        isLoadingServer: query.isLoading,
        refetch: query.refetch,
    };
};
