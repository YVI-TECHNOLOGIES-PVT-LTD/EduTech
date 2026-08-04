"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceRepository = void 0;
const Attendance_1 = require("../../domain/attendance/Attendance");
const AttendanceSession_1 = require("../../domain/attendance/AttendanceSession");
const AttendanceCorrection_1 = require("../../domain/attendance/AttendanceCorrection");
const supabase_1 = require("../../../../config/supabase");
const compatibility_repository_1 = require("../../../compatibility/compatibility.repository");
class AttendanceRepository {
    async findSessionById(id) {
        const { data, error } = await supabase_1.supabase
            .from('student_attendance_sessions')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new AttendanceSession_1.AttendanceSession(data.id, data.school_id, data.academic_year_id, data.grade, data.section_id, new Date(data.date), data.session_status, data.created_by, new Date(data.created_at)) : null;
    }
    async findSessionByDetails(schoolId, academicYearId, grade, sectionId, date) {
        const { data, error } = await supabase_1.supabase
            .from('student_attendance_sessions')
            .select('*')
            .eq('school_id', schoolId)
            .eq('academic_year_id', academicYearId)
            .eq('grade', grade)
            .eq('section_id', sectionId)
            .eq('date', date.toISOString().substring(0, 10))
            .maybeSingle();
        if (error)
            throw error;
        return data ? new AttendanceSession_1.AttendanceSession(data.id, data.school_id, data.academic_year_id, data.grade, data.section_id, new Date(data.date), data.session_status, data.created_by, new Date(data.created_at)) : null;
    }
    async saveSession(session) {
        await compatibility_repository_1.CompatibilityRepository.syncSaveSession({
            id: session.id,
            school_id: session.schoolId,
            academic_year_id: session.academicYearId,
            section_id: session.sectionId,
            date: session.date.toISOString().substring(0, 10),
            grade: session.grade,
            created_by: session.createdBy,
            session_status: session.status
        });
    }
    async findById(id) {
        const { data, error } = await supabase_1.supabase
            .from('student_attendance')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new Attendance_1.Attendance(data.id, data.session_id, data.student_id, data.status, data.remarks, data.marked_by, new Date(data.marked_at), new Date(data.updated_at)) : null;
    }
    async findByStudentAndSession(studentId, sessionId) {
        const { data, error } = await supabase_1.supabase
            .from('student_attendance')
            .select('*')
            .eq('session_id', sessionId)
            .eq('student_id', studentId)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new Attendance_1.Attendance(data.id, data.session_id, data.student_id, data.status, data.remarks, data.marked_by, new Date(data.marked_at), new Date(data.updated_at)) : null;
    }
    async save(attendance) {
        await compatibility_repository_1.CompatibilityRepository.syncSaveRecords(attendance.sessionId, [{
                student_id: attendance.studentId,
                status: attendance.status,
                remarks: attendance.remarks,
                marked_by: attendance.markedBy
            }]);
    }
    async savePeriod(period) {
        const { error } = await supabase_1.supabase
            .from('student_period_attendance')
            .upsert({
            id: period.id,
            student_id: period.studentId,
            academic_year_id: period.academicYearId,
            date: period.date.toISOString().substring(0, 10),
            period_number: period.periodNumber,
            subject_id: period.subjectId,
            status: period.status,
            marked_by: period.markedBy
        });
        if (error)
            throw error;
    }
    async findCorrectionById(id) {
        const { data, error } = await supabase_1.supabase
            .from('student_attendance_corrections')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw error;
        return data ? new AttendanceCorrection_1.AttendanceCorrection(data.id, data.attendance_id, data.requested_status, data.reason, data.status, data.processed_by, data.processed_at ? new Date(data.processed_at) : null, new Date(data.created_at)) : null;
    }
    async saveCorrection(correction) {
        const { error } = await supabase_1.supabase
            .from('student_attendance_corrections')
            .upsert({
            id: correction.id,
            attendance_id: correction.attendanceId,
            requested_status: correction.requestedStatus,
            reason: correction.reason,
            status: correction.status,
            processed_by: correction.processedBy,
            processed_at: correction.processedAt ? correction.processedAt.toISOString() : null
        });
        if (error)
            throw error;
    }
    async getWorkflowRule(fromStatus, toStatus, role) {
        const { data, error } = await supabase_1.supabase
            .from('attendance_workflow_rules')
            .select('allowed')
            .eq('from_status', fromStatus)
            .eq('to_status', toStatus)
            .eq('role', role)
            .maybeSingle();
        if (error)
            throw error;
        return data ? data.allowed : false;
    }
    async logStatusChange(change) {
        const { error } = await supabase_1.supabase
            .from('student_attendance_logs')
            .insert({
            attendance_id: change.attendance_id,
            old_status: change.old_status,
            new_status: change.new_status,
            changed_by: change.changed_by,
            reason: change.reason
        });
        if (error)
            throw error;
    }
}
exports.AttendanceRepository = AttendanceRepository;
