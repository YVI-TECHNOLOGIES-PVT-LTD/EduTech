"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceNotificationService = void 0;
const BaseService_1 = require("../../admission/services/BaseService");
const supabase_1 = require("../../../config/supabase");
class AttendanceNotificationService extends BaseService_1.BaseService {
    async triggerShortageNotification(studentId, currentPercentage, correlationId) {
        this.logInfo(`Enqueuing warning notifications shortage alert for student: ${studentId}`, correlationId);
        const { data, error } = await supabase_1.supabase
            .from('attendance_event_outbox')
            .insert({
            event_name: 'AttendanceShortageDetected',
            payload: {
                student_id: studentId,
                percentage: currentPercentage,
                message: `Warning: Attendance falls to ${currentPercentage.toFixed(2)}% below the 75% threshold.`
            }
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.AttendanceNotificationService = AttendanceNotificationService;
exports.default = AttendanceNotificationService;
