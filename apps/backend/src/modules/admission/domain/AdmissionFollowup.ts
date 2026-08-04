export type FollowupStatus = 'scheduled' | 'completed' | 'missed' | 'cancelled';

export class AdmissionFollowup {
    constructor(
        public readonly id: string,
        public readonly leadId: string,
        public readonly scheduledDate: Date,
        public completedDate: Date | null,
        public status: FollowupStatus,
        public notes: string | null,
        public readonly createdBy: string,
        public readonly createdAt: Date,
        public updatedAt: Date
    ) {}

    public complete(notes?: string | null) {
        this.status = 'completed';
        this.completedDate = new Date();
        this.updatedAt = new Date();
        if (notes !== undefined) {
            this.notes = notes;
        }
    }

    public miss() {
        this.status = 'missed';
        this.updatedAt = new Date();
    }

    public cancel(notes?: string | null) {
        this.status = 'cancelled';
        this.updatedAt = new Date();
        if (notes !== undefined) {
            this.notes = notes;
        }
    }
}
