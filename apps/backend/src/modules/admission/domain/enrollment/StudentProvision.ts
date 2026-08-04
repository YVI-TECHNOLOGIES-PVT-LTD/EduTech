export type ProvisionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export class StudentProvision {
    constructor(
        public readonly id: string,
        public readonly applicationId: string,
        public readonly stepName: string,
        public status: ProvisionStatus,
        public errorMessage: string | null,
        public readonly createdAt: Date,
        public updatedAt: Date
    ) {}

    public complete() {
        this.status = 'COMPLETED';
        this.errorMessage = null;
        this.updatedAt = new Date();
    }

    public fail(errorMsg: string) {
        this.status = 'FAILED';
        this.errorMessage = errorMsg;
        this.updatedAt = new Date();
    }
}
