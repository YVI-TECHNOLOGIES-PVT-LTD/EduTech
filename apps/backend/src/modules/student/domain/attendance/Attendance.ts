export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';

export class Attendance {
    constructor(
        public readonly id: string,
        public readonly sessionId: string,
        public readonly studentId: string,
        public status: AttendanceStatus,
        public readonly remarks: string | null,
        public readonly markedBy: string | null,
        public readonly markedAt: Date,
        public updatedAt: Date
    ) {}

    public transitionStatus(newStatus: AttendanceStatus) {
        this.status = newStatus;
        this.updatedAt = new Date();
    }
}
