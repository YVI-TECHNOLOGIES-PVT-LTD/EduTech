import { AttendanceRepository } from '../../repositories/attendance/AttendanceRepository';

export class AttendanceTimelineService {
    constructor(private readonly attendanceRepo: AttendanceRepository) {}

    public async getTimeline(studentId: string): Promise<any[]> {
        // Return blank log timeline
        return [];
    }
}
