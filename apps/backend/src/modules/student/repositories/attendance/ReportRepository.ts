import { AttendanceSummary } from '../../domain/attendance/AttendanceSummary';
import { supabase } from '../../../../config/supabase';

export class ReportRepository {
    public async findSummary(
        studentId: string,
        academicYearId: string,
        month: number
    ): Promise<AttendanceSummary | null> {
        const { data, error } = await supabase
            .from('student_attendance_summary')
            .select('*')
            .eq('student_id', studentId)
            .eq('academic_year_id', academicYearId)
            .eq('month', month)
            .maybeSingle();

        if (error) throw error;
        return data ? new AttendanceSummary(
            data.id,
            data.student_id,
            data.academic_year_id,
            data.month,
            data.total_present,
            data.total_absent,
            data.total_late,
            Number(data.attendance_percentage),
            new Date(data.last_calculated)
        ) : null;
    }

    public async saveSummary(summary: AttendanceSummary): Promise<void> {
        const { error } = await supabase
            .from('student_attendance_summary')
            .upsert({
                id: summary.id,
                student_id: summary.studentId,
                academic_year_id: summary.academicYearId,
                month: summary.month,
                total_present: summary.totalPresent,
                total_absent: summary.totalAbsent,
                total_late: summary.totalLate,
                attendance_percentage: summary.attendancePercentage
            });

        if (error) throw error;
    }

    public async countAttendanceByStatus(
        studentId: string,
        academicYearId: string,
        month: number,
        status: string
    ): Promise<number> {
        // Query to match attendance items
        const { data, error } = await supabase
            .from('student_attendance')
            .select('*, student_attendance_sessions!inner(academic_year_id, date)')
            .eq('student_id', studentId)
            .eq('status', status)
            .eq('student_attendance_sessions.academic_year_id', academicYearId);

        if (error) throw error;

        // Filter by month in Javascript to support local timezone check simply
        const matches = (data || []).filter((row: any) => {
            const date = new Date((row as any).student_attendance_sessions.date);
            return (date.getMonth() + 1) === month;
        });

        return matches.length;
    }

    public async saveReport(report: any): Promise<void> {
        const { error } = await supabase
            .from('student_attendance_reports')
            .insert(report);

        if (error) throw error;
    }

    public async saveDashboardMetrics(metrics: any): Promise<void> {
        const { error } = await supabase
            .from('attendance_dashboard_metrics')
            .upsert({
                id: metrics.id,
                school_id: metrics.schoolId,
                date: metrics.date.toISOString().substring(0, 10),
                total_enrolled: metrics.totalEnrolled,
                total_present: metrics.totalPresent,
                total_absent: metrics.totalAbsent,
                total_late: metrics.totalLate,
                average_attendance_percentage: metrics.averageAttendancePercentage
            });

        if (error) throw error;
    }
}
