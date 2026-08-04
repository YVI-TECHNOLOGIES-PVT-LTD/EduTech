export class StudentTransfer {
    constructor(
        public readonly id: string,
        public readonly studentId: string,
        public readonly destinationSchool: string,
        public readonly reason: string,
        public readonly requestedAt: Date,
        public status: 'PENDING' | 'APPROVED' | 'REJECTED'
    ) {}

    public approve() {
        this.status = 'APPROVED';
    }

    public reject() {
        this.status = 'REJECTED';
    }
}
