export class StudentIdentity {
    constructor(
        public readonly id: string,
        public readonly studentId: string,
        public readonly barcode: string,
        public readonly qrCode: string | null,
        public printed: boolean,
        public issuedDate: Date | null,
        public readonly createdAt: Date
    ) {}

    public markAsPrinted() {
        this.printed = true;
        this.issuedDate = new Date();
    }
}
