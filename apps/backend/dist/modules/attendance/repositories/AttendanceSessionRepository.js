"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceSessionRepository = void 0;
const supabase_1 = require("../../../config/supabase");
const BaseRepository_1 = require("../../admission/repositories/BaseRepository");
class AttendanceSessionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('attendance_sessions');
    }
    async createSession(schoolId, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            school_id: schoolId,
            campus_id: payload.campus_id,
            branch_id: payload.branch_id,
            academic_year_id: payload.academic_year_id,
            session_date: payload.session_date,
            timetable_slot_id: payload.timetable_slot_id,
            status: 'DRAFT'
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateStatus(sessionId, status) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update({ status })
            .eq('id', sessionId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async listSessions(schoolId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('school_id', schoolId)
            .order('session_date', { ascending: false });
        if (error)
            throw error;
        return data || [];
    }
}
exports.AttendanceSessionRepository = AttendanceSessionRepository;
exports.default = AttendanceSessionRepository;
