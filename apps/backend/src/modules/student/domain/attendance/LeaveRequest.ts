export class LeaveRequest {
    constructor(
        public readonly id: string,
        public readonly studentId: string,
        public readonly leaveTypeId: string,
        public readonly startDate: Date,
        public readonly endDate: Date,
        public readonly reason: string,
        public status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED',
        public readonly createdAt: Date,
        public updatedAt: Date
    ) {}

    public transitionStatus(newStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED') {
        this.status = newStatus;
        this.updatedAt = new Date();
    }
}
