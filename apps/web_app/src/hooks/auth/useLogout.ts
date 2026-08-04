import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../auth/auth.service';

export const useLogout = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: () => AuthService.logout(),

        onSuccess: () => {
            // Clear all cached queries on logout to prevent data leakage
            queryClient.clear();
            navigate('/login');
        },

        onError: (error: Error) => {
            console.error('[useLogout] Logout failed:', error.message);
            // Force clear even on error
            queryClient.clear();
            navigate('/login');
        },
    });
};
