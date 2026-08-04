"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceOutboxRepository = void 0;
const supabase_1 = require("../../../config/supabase");
const BaseRepository_1 = require("../../admission/repositories/BaseRepository");
class AttendanceOutboxRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('attendance_event_outbox');
    }
    async queueEvent(eventName, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            event_name: eventName,
            payload,
            status: 'PENDING'
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.AttendanceOutboxRepository = AttendanceOutboxRepository;
exports.default = AttendanceOutboxRepository;
