export class FeeAssignment {
    constructor(
        public readonly id: string,
        public readonly applicationId: string,
        public readonly componentId: string,
        public readonly amount: number,
        public waivedAmount: number,
        public paidAmount: number,
        public readonly createdAt: Date
    ) {}

    public get outstandingAmount(): number {
        return Math.max(0, this.amount - this.waivedAmount - this.paidAmount);
    }

    public recordPayment(amountToPay: number) {
        this.paidAmount += amountToPay;
    }

    public recordWaiver(amountToWaive: number) {
        this.waivedAmount += amountToWaive;
    }
}
