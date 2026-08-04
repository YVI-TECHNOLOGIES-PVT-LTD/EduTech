import { AttendanceRepository } from '../../repositories/attendance/AttendanceRepository';
import { AttendanceSession } from '../../domain/attendance/AttendanceSession';

export class AttendanceSessionService {
    constructor(private readonly attendanceRepo: AttendanceRepository) {}

    public async getOrCreateSession(
        schoolId: string,
        academicYearId: string,
        grade: string,
        sectionId: string,
        date: Date,
        createdBy: string | null
    ): Promise<AttendanceSession> {
        let session = await this.attendanceRepo.findSessionByDetails(
            schoolId,
            academicYearId,
            grade,
            sectionId,
            date
        );

        if (!session) {
            session = new AttendanceSession(
                crypto.randomUUID(),
                schoolId,
                academicYearId,
                grade,
                sectionId,
                date,
                'OPEN',
                createdBy,
                new Date()
            );
            await this.attendanceRepo.saveSession(session);
        }

        return session;
    }
}
