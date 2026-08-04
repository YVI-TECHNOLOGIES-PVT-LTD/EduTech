"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamExportService = void 0;
const supabase_1 = require("../../../config/supabase");
exports.ExamExportService = {
    /**
     * Generate Compliance Data suitable for CSV/Excel export
     */
    async getComplianceExportData(examId) {
        // 1. Fetch Published Results with Student and Section Details
        const { data: results, error } = await supabase_1.supabase
            .from('student_result_summaries')
            .select(`
                total_obtained, total_max, percentage, grade, result_status,
                published_at,
                student:student_id(full_name, student_code),
                class_name_snapshot, section_name_snapshot
            `)
            .eq('exam_id', examId)
            .eq('is_published', true);
        if (error)
            throw error;
        // 2. Format into flat records
        return results.map(r => ({
            'Student Name': r.student?.full_name,
            'Student Code': r.student?.student_code,
            'Class': r.class_name_snapshot,
            'Section': r.section_name_snapshot,
            'Total Obtained': r.total_obtained,
            'Max Marks': r.total_max,
            'Percentage': `${r.percentage}%`,
            'Grade': r.grade,
            'Status': r.result_status,
            'Published At': r.published_at ? new Date(r.published_at).toLocaleString() : 'N/A'
        }));
    },
    /**
     * Generate Malpractice/Absent Report Data
     */
    async getConductExportData(examId) {
        const { data: attendance, error } = await supabase_1.supabase
            .from('exam_attendance')
            .select(`
                status, remarks, marked_at,
                student:student_id(full_name, student_code),
                schedule:exam_schedule_id(
                    subject:subject_id(name, code),
                    exam_date
                )
            `)
            .eq('schedule.exam_id', examId)
            .in('status', ['ABSENT', 'MALPRACTICE']);
        if (error)
            throw error;
        return attendance.map((a) => ({
            'Date': a.schedule?.exam_date,
            'Subject': `${a.schedule?.subject?.name} (${a.schedule?.subject?.code})`,
            'Student': a.student?.full_name,
            'Code': a.student?.student_code,
            'Status': a.status,
            'Remarks': a.remarks || 'No remarks',
            'Marked At': new Date(a.marked_at).toLocaleString()
        }));
    },
    /**
     * Generate Audit / Override Logs Export
     */
    async getAuditExportData(examId) {
        const { data: logs, error } = await supabase_1.supabase
            .from('v_exam_audit_comprehensive')
            .select('*')
            .or(`相关_exam_id.eq.${examId},details->>exam_id.eq.${examId}`);
        if (error)
            throw error;
        return logs.map(l => ({
            'Timestamp': new Date(l.created_at).toLocaleString(),
            'Action': l.action,
            'Performed By': l.performed_by_name,
            'Reason': l.reason || 'N/A',
            'Details': JSON.stringify(l.details)
        }));
    }
};
