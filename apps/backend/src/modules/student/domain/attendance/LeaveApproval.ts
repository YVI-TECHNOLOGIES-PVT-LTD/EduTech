export class LeaveApproval {
    constructor(
        public readonly id: string,
        public readonly requestId: string,
        public readonly approvedBy: string | null,
        public readonly approvedAt: Date,
        public readonly remarks: string | null
    ) {}
}
