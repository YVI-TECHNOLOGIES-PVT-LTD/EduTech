"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceOutboxService = void 0;
const BaseService_1 = require("../../admission/services/BaseService");
const supabase_1 = require("../../../config/supabase");
class AttendanceOutboxService extends BaseService_1.BaseService {
    async processPendingEvents(correlationId) {
        this.logInfo(`Scanning event outbox register for pending logs`, correlationId);
        const { data: events, error } = await supabase_1.supabase
            .from('attendance_event_outbox')
            .select('*')
            .eq('status', 'PENDING');
        if (error)
            throw error;
        for (const evt of events || []) {
            // Mark processed
            await supabase_1.supabase
                .from('attendance_event_outbox')
                .update({ status: 'PROCESSED' })
                .eq('id', evt.id);
        }
    }
}
exports.AttendanceOutboxService = AttendanceOutboxService;
exports.default = AttendanceOutboxService;
