"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceStatisticsService = void 0;
const BaseService_1 = require("../../admission/services/BaseService");
const supabase_1 = require("../../../config/supabase");
class AttendanceStatisticsService extends BaseService_1.BaseService {
    async calculateRosterPercentages(studentId, correlationId) {
        this.logInfo(`Running roll-up attendance metrics for student: ${studentId}`, correlationId);
        // Fetch records
        const { data: records, error } = await supabase_1.supabase
            .from('attendance_records')
            .select('*')
            .eq('student_id', studentId);
        if (error)
            throw error;
        let totalSessions = records?.length || 0;
        let presentSessions = 0;
        for (const rec of records || []) {
            if (rec.status === 'PRESENT' || rec.status === 'LATE' || rec.status === 'ONLINE' || rec.status === 'HYBRID') {
                presentSessions++;
            }
        }
        const percentage = totalSessions > 0 ? (presentSessions / totalSessions) * 100.00 : 100.00;
        const { data: stats, error: statsError } = await supabase_1.supabase
            .from('student_attendance_statistics')
            .insert({
            student_id: studentId,
            overall_percentage: percentage
        })
            .select()
            .single();
        if (statsError)
            throw statsError;
        return stats;
    }
}
exports.AttendanceStatisticsService = AttendanceStatisticsService;
exports.default = AttendanceStatisticsService;
