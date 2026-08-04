"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceCalendarRepository = void 0;
const supabase_1 = require("../../../config/supabase");
const BaseRepository_1 = require("../../admission/repositories/BaseRepository");
class AttendanceCalendarRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('attendance_calendars');
    }
    async createCalendar(schoolId, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            school_id: schoolId,
            campus_id: payload.campus_id,
            branch_id: payload.branch_id,
            academic_year_id: payload.academic_year_id,
            calendar_name: payload.calendar_name
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async setCalendarDay(calendarId, payload) {
        const { data, error } = await supabase_1.supabase
            .from('attendance_calendar_days')
            .insert({
            calendar_id: calendarId,
            day_date: payload.day_date,
            day_type: payload.day_type,
            remarks: payload.remarks || null
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.AttendanceCalendarRepository = AttendanceCalendarRepository;
exports.default = AttendanceCalendarRepository;
