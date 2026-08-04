import { useQuery, useMutation } from '@tanstack/react-query';
import { studentApi } from '../services/student.api';

export function useStudentReports() {
    const exportMutation = useMutation({
        mutationFn: (params: any) => studentApi.exportStudents(params).then(res => res.data),
    });

    return {
        exportStudents: exportMutation.mutateAsync,
        isExporting: exportMutation.isPending,
    };
}
