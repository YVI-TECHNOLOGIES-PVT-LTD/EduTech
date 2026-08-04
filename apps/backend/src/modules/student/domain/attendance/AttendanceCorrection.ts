export class AttendanceCorrection {
    constructor(
        public readonly id: string,
        public readonly attendanceId: string,
        public readonly requestedStatus: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY',
        public readonly reason: string,
        public status: 'PENDING' | 'APPROVED' | 'REJECTED',
        public processedBy: string | null,
        public processedAt: Date | null,
        public readonly createdAt: Date
    ) {}

    public approve(processedBy: string | null) {
        this.status = 'APPROVED';
        this.processedBy = processedBy;
        this.processedAt = new Date();
    }

    public reject(processedBy: string | null) {
        this.status = 'REJECTED';
        this.processedBy = processedBy;
        this.processedAt = new Date();
    }
}
