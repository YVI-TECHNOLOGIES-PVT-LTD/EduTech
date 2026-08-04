import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '../services/student.api';

export function useStudents(params?: any) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['students', 'list', params],
        queryFn: () => studentApi.list(params).then(res => res.data),
    });

    const registerMutation = useMutation({
        mutationFn: studentApi.register,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
        },
    });

    const updateProfileMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => studentApi.updateProfile(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['student', variables.id] });
        },
    });

    const updateParentsMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => studentApi.updateParents(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['student', variables.id] });
        },
    });

    return {
        ...query,
        registerStudent: registerMutation.mutateAsync,
        isRegistering: registerMutation.isPending,
        updateProfile: updateProfileMutation.mutateAsync,
        isUpdatingProfile: updateProfileMutation.isPending,
        updateParents: updateParentsMutation.mutateAsync,
        isUpdatingParents: updateParentsMutation.isPending,
    };
}
