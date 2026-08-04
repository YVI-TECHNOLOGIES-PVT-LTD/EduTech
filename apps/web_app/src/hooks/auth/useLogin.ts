import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../auth/auth.service';
import { QUERY_KEYS } from '../../lib/queryKeys';

interface LoginCredentials {
    email: string;
    password: string;
    redirectTo?: string;
}

export const useLogin = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: ({ email, password }: LoginCredentials) =>
            AuthService.login(email, password),

        onSuccess: (_data, variables) => {
            // Invalidate current user query so AuthContext refetches enriched profile
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STUDENT.ALL });
            navigate(variables.redirectTo ?? '/app/dashboard');
        },

        onError: (error: Error) => {
            console.error('[useLogin] Login failed:', error.message);
        },
    });
};
