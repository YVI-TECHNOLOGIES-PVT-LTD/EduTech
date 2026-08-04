"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceValidationService = void 0;
const BaseService_1 = require("../../admission/services/BaseService");
const supabase_1 = require("../../../config/supabase");
class AttendanceValidationService extends BaseService_1.BaseService {
    async validateMarking(studentId, sessionDate, correlationId) {
        this.logInfo(`Validating attendance marking credentials for student: ${studentId}`, correlationId);
        // Check for approved leave overlaps
        const { data: leaves } = await supabase_1.supabase
            .from('student_leave_requests')
            .select('*')
            .eq('student_id', studentId)
            .eq('status', 'APPROVED');
        for (const leave of leaves || []) {
            const start = new Date(leave.start_date);
            const end = new Date(leave.end_date);
            const current = new Date(sessionDate);
            if (current >= start && current <= end) {
                throw new Error('Attendance marking failed. Student has an approved leave overlap for this date.');
            }
        }
    }
}
exports.AttendanceValidationService = AttendanceValidationService;
exports.default = AttendanceValidationService;
