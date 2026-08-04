export type LeadStatus = 'NEW' | 'CONTACTED' | 'FOLLOW_UP' | 'VISITED' | 'INTERESTED' | 'NOT_INTERESTED' | 'LOST';

export class AdmissionLead {
    constructor(
        public readonly id: string,
        public readonly enquiryId: string | null,
        public counselorId: string | null,
        public status: LeadStatus,
        public lostReason: string | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
        public deletedAt: Date | null = null
    ) {}

    public assignCounselor(counselorId: string) {
        this.counselorId = counselorId;
        this.status = 'CONTACTED';
        this.updatedAt = new Date();
    }

    public updateStatus(status: LeadStatus, lostReason: string | null = null) {
        this.status = status;
        if (status === 'LOST') {
            this.lostReason = lostReason;
        } else {
            this.lostReason = null;
        }
        this.updatedAt = new Date();
    }

    public softDelete() {
        this.deletedAt = new Date();
        this.updatedAt = new Date();
    }
}
