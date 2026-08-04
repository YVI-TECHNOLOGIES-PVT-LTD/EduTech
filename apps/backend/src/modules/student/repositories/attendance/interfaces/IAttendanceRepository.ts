import { Attendance } from '../../../domain/attendance/Attendance';
import { AttendanceSession } from '../../../domain/attendance/AttendanceSession';
import { AttendancePeriod } from '../../../domain/attendance/AttendancePeriod';

export interface IAttendanceRepository {
    findSessionById(id: string): Promise<AttendanceSession | null>;
    findSessionByDetails(
        schoolId: string,
        academicYearId: string,
        grade: string,
        sectionId: string,
        date: Date
    ): Promise<AttendanceSession | null>;
    saveSession(session: AttendanceSession): Promise<void>;
    
    findById(id: string): Promise<Attendance | null>;
    findByStudentAndSession(studentId: string, sessionId: string): Promise<Attendance | null>;
    save(attendance: Attendance): Promise<void>;
    
    savePeriod(period: AttendancePeriod): Promise<void>;
}
