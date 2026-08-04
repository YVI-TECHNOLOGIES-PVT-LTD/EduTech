export type OfferStatus = 'GENERATED' | 'SENT' | 'ACCEPTED' | 'ENROLLED' | 'EXPIRED';

export class OfferLetter {
    constructor(
        public readonly id: string,
        public readonly applicationId: string,
        public readonly offerNumber: string,
        public readonly templateId: string,
        public readonly issueDate: Date,
        public acceptanceDate: Date | null,
        public readonly expiryDate: Date,
        public status: OfferStatus,
        public readonly createdAt: Date,
        public updatedAt: Date
    ) {}

    public transition(newStatus: OfferStatus) {
        this.status = newStatus;
        if (newStatus === 'ACCEPTED') {
            this.acceptanceDate = new Date();
        }
        this.updatedAt = new Date();
    }
}
