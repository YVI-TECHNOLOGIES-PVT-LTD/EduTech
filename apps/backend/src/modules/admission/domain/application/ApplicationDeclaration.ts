export class ApplicationDeclaration {
    constructor(
        public readonly id: string,
        public readonly applicationId: string,
        public agreedToTerms: boolean,
        public parentSignature: string | null,
        public dateSigned: Date | null,
        public readonly createdAt: Date,
        public updatedAt: Date
    ) {}

    public sign(signature: string) {
        this.agreedToTerms = true;
        this.parentSignature = signature;
        this.dateSigned = new Date();
        this.updatedAt = new Date();
    }
}
