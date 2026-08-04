"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamAnalyticsService = void 0;
const supabase_1 = require("../../../config/supabase");
exports.ExamAnalyticsService = {
    // 1. Overview KPIs
    async getExamOverview(examId) {
        // Fetch passing students
        const { count: passCount, error: passError } = await supabase_1.supabase
            .from('student_result_summaries')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', examId)
            .eq('result_status', 'PASS');
        // Fetch failing students
        const { count: failCount, error: failError } = await supabase_1.supabase
            .from('student_result_summaries')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', examId)
            .eq('result_status', 'FAIL');
        // Total
        const total = (passCount || 0) + (failCount || 0);
        const passPercentage = total > 0 ? ((passCount || 0) / total * 100).toFixed(2) : 0;
        // Average Overall Percentage
        const { data: avgData, error: avgError } = await supabase_1.supabase
            .from('student_result_summaries')
            .select('percentage')
            .eq('exam_id', examId);
        const totalPercentage = avgData?.reduce((sum, r) => sum + (r.percentage || 0), 0) || 0;
        const avgPercentage = total > 0 ? (totalPercentage / total).toFixed(2) : 0;
        return {
            totalStudents: total,
            passCount: passCount || 0,
            failCount: failCount || 0,
            passPercentage: Number(passPercentage),
            avgPercentage: Number(avgPercentage)
        };
    },
    // 2. Grade Distribution
    async getGradeDistribution(examId) {
        // We use a raw query or group in JS if needed. 
        // Supabase-js doesn't support GROUP BY directly in ORM easily for aggregates without view or RPC.
        // We will fetch minimal data and aggregate in memory (assuming batch size is reasonable for a school context).
        const { data, error } = await supabase_1.supabase
            .from('student_result_summaries')
            .select('grade')
            .eq('exam_id', examId);
        if (error)
            throw error;
        const distribution = {};
        data?.forEach((r) => {
            const grade = r.grade || 'N/A';
            distribution[grade] = (distribution[grade] || 0) + 1;
        });
        // Format for Chart
        return Object.entries(distribution).map(([grade, count]) => ({
            grade, count
        })).sort((a, b) => a.grade.localeCompare(b.grade));
    },
    // 3. Subject-Wise Performance
    async getSubjectPerformance(examId) {
        // Marks table has marks_obtained and max_marks (implied from schedule)
        // We need to group by subject_id.
        // 1. Get all marks for this exam
        const { data: marks, error } = await supabase_1.supabase
            .from('marks')
            .select(`
                marks_obtained,
                subject:subject_id(id, name, code)
            `)
            .eq('exam_id', examId);
        if (error)
            throw error;
        // 2. Aggregate
        const subjectStats = {};
        marks?.forEach((m) => {
            const sName = m.subject?.name || 'Unknown';
            const sId = m.subject?.id;
            if (!subjectStats[sId]) {
                subjectStats[sId] = {
                    id: sId,
                    subjectName: sName,
                    totalMarks: 0,
                    count: 0,
                    highest: 0,
                    lowest: 1000 // arbitrarily high
                };
            }
            const obtained = Number(m.marks_obtained);
            subjectStats[sId].totalMarks += obtained;
            subjectStats[sId].count += 1;
            if (obtained > subjectStats[sId].highest)
                subjectStats[sId].highest = obtained;
            if (obtained < subjectStats[sId].lowest)
                subjectStats[sId].lowest = obtained;
        });
        return Object.values(subjectStats).map((s) => ({
            ...s,
            average: s.count > 0 ? (s.totalMarks / s.count).toFixed(2) : 0,
            lowest: s.lowest === 1000 ? 0 : s.lowest
        }));
    },
    // 4. Top Performers
    async getTopPerformers(examId, limit = 5) {
        const { data, error } = await supabase_1.supabase
            .from('student_result_summaries')
            .select(`
                total_obtained, percentage, grade, rank,
                student:student_id(full_name, student_code)
            `)
            .eq('exam_id', examId)
            .order('rank', { ascending: true }) // Rank 1 is top
            .limit(limit);
        if (error)
            throw error;
        return data;
    },
    // 5. COMPLIANCE REPORT (Eligible vs Appeared vs Passed)
    async getComplianceReport(examId) {
        const { data, error } = await supabase_1.supabase
            .from('v_exam_compliance_metrics')
            .select('*')
            .eq('exam_id', examId)
            .single();
        if (error)
            throw error;
        return data;
    },
    // 6. SECTION-WISE ANALYTICS
    async getSectionAnalytics(examId) {
        const { data, error } = await supabase_1.supabase
            .from('v_section_performance_analytics')
            .select('*')
            .eq('exam_id', examId);
        if (error)
            throw error;
        return data;
    },
    // 7. AUDIT LOGS (Override logs, etc.)
    async getAuditTrails(examId) {
        // Since the view has JSONB extraction, we filter by the extracted field
        const { data, error } = await supabase_1.supabase
            .from('v_exam_audit_comprehensive')
            .select('*')
            .or(`相关_exam_id.eq.${examId},details->>exam_id.eq.${examId}`);
        if (error)
            throw error;
        return data;
    },
    // 8. ATTENDANCE VS RESULT CORRELATION
    async getAttendanceCorrelation(examId) {
        // We look at students who were ABSENT/PRESENT vs their Result Status
        const { data, error } = await supabase_1.supabase
            .from('student_result_summaries')
            .select(`
                result_status,
                student_id
            `)
            .eq('exam_id', examId);
        if (error)
            throw error;
        const { data: attendance } = await supabase_1.supabase
            .from('exam_attendance')
            .select('student_id, status')
            .in('student_id', data?.map(d => d.student_id) || [])
            .is('exam_schedule_id', (await supabase_1.supabase.from('exam_schedules').select('id').eq('exam_id', examId).limit(1).single()).data?.id); // Approximation for overall presence
        // Grouping logic here...
        return { message: "Detailed correlation requires cross-subject aggregation. Preview available via Result vs Attendance views." };
    },
    // 9. MALPRACTICE & ABSENT LISTS (For compliance)
    async getComplianceLists(examId) {
        const { data, error } = await supabase_1.supabase
            .from('exam_attendance')
            .select(`
                status, remarks,
                student:student_id(full_name, student_code),
                schedule:exam_schedule_id(subject:subject_id(name))
            `)
            .eq('schedule.exam_id', examId)
            .neq('status', 'PRESENT');
        if (error)
            throw error;
        return data;
    }
};
