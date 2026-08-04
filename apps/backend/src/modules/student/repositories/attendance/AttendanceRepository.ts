import { IAttendanceRepository } from './interfaces/IAttendanceRepository';
import { Attendance, AttendanceStatus } from '../../domain/attendance/Attendance';
import { AttendanceSession } from '../../domain/attendance/AttendanceSession';
import { AttendancePeriod } from '../../domain/attendance/AttendancePeriod';
import { AttendanceCorrection } from '../../domain/attendance/AttendanceCorrection';
import { supabase } from '../../../../config/supabase';
import { CompatibilityRepository } from '../../../compatibility/compatibility.repository';

export class AttendanceRepository implements IAttendanceRepository {
    public async findSessionById(id: string): Promise<AttendanceSession | null> {
        const { data, error } = await supabase
            .from('student_attendance_sessions')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data ? new AttendanceSession(
            data.id,
            data.school_id,
            data.academic_year_id,
            data.grade,
            data.section_id,
            new Date(data.date),
            data.session_status as any,
            data.created_by,
            new Date(data.created_at)
        ) : null;
    }

    public async findSessionByDetails(
        schoolId: string,
        academicYearId: string,
        grade: string,
        sectionId: string,
        date: Date
    ): Promise<AttendanceSession | null> {
        const { data, error } = await supabase
            .from('student_attendance_sessions')
            .select('*')
            .eq('school_id', schoolId)
            .eq('academic_year_id', academicYearId)
            .eq('grade', grade)
            .eq('section_id', sectionId)
            .eq('date', date.toISOString().substring(0, 10))
            .maybeSingle();

        if (error) throw error;
        return data ? new AttendanceSession(
            data.id,
            data.school_id,
            data.academic_year_id,
            data.grade,
            data.section_id,
            new Date(data.date),
            data.session_status as any,
            data.created_by,
            new Date(data.created_at)
        ) : null;
    }

    public async saveSession(session: AttendanceSession): Promise<void> {
        await CompatibilityRepository.syncSaveSession({
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

    public async findById(id: string): Promise<Attendance | null> {
        const { data, error } = await supabase
            .from('student_attendance')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data ? new Attendance(
            data.id,
            data.session_id,
            data.student_id,
            data.status as AttendanceStatus,
            data.remarks,
            data.marked_by,
            new Date(data.marked_at),
            new Date(data.updated_at)
        ) : null;
    }

    public async findByStudentAndSession(studentId: string, sessionId: string): Promise<Attendance | null> {
        const { data, error } = await supabase
            .from('student_attendance')
            .select('*')
            .eq('session_id', sessionId)
            .eq('student_id', studentId)
            .maybeSingle();

        if (error) throw error;
        return data ? new Attendance(
            data.id,
            data.session_id,
            data.student_id,
            data.status as AttendanceStatus,
            data.remarks,
            data.marked_by,
            new Date(data.marked_at),
            new Date(data.updated_at)
        ) : null;
    }

    public async save(attendance: Attendance): Promise<void> {
        await CompatibilityRepository.syncSaveRecords(attendance.sessionId, [{
            student_id: attendance.studentId,
            status: attendance.status,
            remarks: attendance.remarks,
            marked_by: attendance.markedBy
        }]);
    }

    public async savePeriod(period: AttendancePeriod): Promise<void> {
        const { error } = await supabase
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

        if (error) throw error;
    }

    public async findCorrectionById(id: string): Promise<AttendanceCorrection | null> {
        const { data, error } = await supabase
            .from('student_attendance_corrections')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data ? new AttendanceCorrection(
            data.id,
            data.attendance_id,
            data.requested_status as any,
            data.reason,
            data.status as any,
            data.processed_by,
            data.processed_at ? new Date(data.processed_at) : null,
            new Date(data.created_at)
        ) : null;
    }

    public async saveCorrection(correction: AttendanceCorrection): Promise<void> {
        const { error } = await supabase
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

        if (error) throw error;
    }

    public async getWorkflowRule(fromStatus: string, toStatus: string, role: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('attendance_workflow_rules')
            .select('allowed')
            .eq('from_status', fromStatus)
            .eq('to_status', toStatus)
            .eq('role', role)
            .maybeSingle();

        if (error) throw error;
        return data ? data.allowed : false;
    }

    public async logStatusChange(change: any): Promise<void> {
        const { error } = await supabase
            .from('student_attendance_logs')
            .insert({
                attendance_id: change.attendance_id,
                old_status: change.old_status,
                new_status: change.new_status,
                changed_by: change.changed_by,
                reason: change.reason
            });

        if (error) throw error;
    }
}
