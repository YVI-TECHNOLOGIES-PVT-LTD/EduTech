export type PaymentMode = 'Cash' | 'Card' | 'Cheque' | 'Bank_Transfer' | 'Online_Gateway';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export class Payment {
    constructor(
        public readonly id: string,
        public readonly applicationId: string,
        public readonly amount: number,
        public readonly paymentMode: PaymentMode,
        public readonly transactionNumber: string | null,
        public readonly gatewayReference: string | null,
        public readonly receiptNumber: string,
        public status: PaymentStatus,
        public readonly createdAt: Date,
        public updatedAt: Date
    ) {}

    public transitionStatus(newStatus: PaymentStatus) {
        this.status = newStatus;
        this.updatedAt = new Date();
    }
}
