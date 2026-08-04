export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'EVALUATED';

export class Interview {
    constructor(
        public readonly id: string,
        public readonly applicationId: string,
        public readonly panelId: string,
        public readonly interviewDate: Date,
        public readonly roomName: string,
        public status: InterviewStatus,
        public remarks: string | null,
        public readonly createdAt: Date,
        public updatedAt: Date
    ) {}

    public transition(newStatus: InterviewStatus, remarks?: string) {
        this.status = newStatus;
        if (remarks) this.remarks = remarks;
        this.updatedAt = new Date();
    }
}
