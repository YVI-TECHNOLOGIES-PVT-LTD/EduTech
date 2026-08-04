"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceRecordRepository = void 0;
const supabase_1 = require("../../../config/supabase");
const BaseRepository_1 = require("../../admission/repositories/BaseRepository");
class AttendanceRecordRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('attendance_records');
    }
    async markAttendance(payload, userId) {
        const { data: existing } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('session_id', payload.session_id)
            .eq('student_id', payload.student_id)
            .maybeSingle();
        if (existing) {
            // Save audit snapshot to version history
            await supabase_1.supabase
                .from('attendance_record_versions')
                .insert({
                attendance_record_id: existing.id,
                previous_snapshot: existing,
                changed_by: userId,
                changed_reason: 'Attendance corrected post validation checks'
            });
            const { data, error } = await supabase_1.supabase
                .from(this.tableName)
                .update({
                status: payload.status,
                source: payload.source,
                marked_by: userId,
                marked_at: new Date()
            })
                .eq('id', existing.id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        else {
            const { data, error } = await supabase_1.supabase
                .from(this.tableName)
                .insert({
                session_id: payload.session_id,
                student_id: payload.student_id,
                status: payload.status,
                source: payload.source,
                marked_by: userId
            })
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
    }
    async getRecordsBySession(sessionId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('session_id', sessionId);
        if (error)
            throw error;
        return data || [];
    }
}
exports.AttendanceRecordRepository = AttendanceRecordRepository;
exports.default = AttendanceRecordRepository;
