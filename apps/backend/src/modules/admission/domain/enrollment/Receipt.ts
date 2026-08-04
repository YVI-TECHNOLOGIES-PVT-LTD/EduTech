export class Receipt {
    constructor(
        public readonly id: string,
        public readonly paymentId: string,
        public readonly receiptNumber: string,
        public readonly issuedAt: Date
    ) {}
}
