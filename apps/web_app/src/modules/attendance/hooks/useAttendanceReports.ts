import { useMutation } from '@tanstack/react-query';
import { attendanceApi } from '../services/attendance.api';

export function useAttendanceReports() {
    const generateReport = useMutation({
        mutationFn: attendanceApi.generateAttendanceReport,
    });

    return {
        generateReport: generateReport.mutateAsync,
        isGenerating: generateReport.isPending,
        error: generateReport.error,
    };
}
export default useAttendanceReports;
