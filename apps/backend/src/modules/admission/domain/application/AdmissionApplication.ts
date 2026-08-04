export type ApplicationStatus = 'DRAFT' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'CORRECTION_REQUIRED' | 'SUBMITTED' | 'DOCS_PENDING' | 'DOCUMENT_VERIFIED' | 'EXAM' | 'INTERVIEW' | 'MERIT' | 'OFFERED' | 'FEE_PENDING' | 'FEE_VERIFIED' | 'ENROLLED' | 'REJECTED' | 'WITHDRAWN';

export class AdmissionApplication {
    constructor(
        public readonly id: string,
        public readonly schoolId: string,
        public readonly academicYearId: string,
        public readonly leadId: string | null,
        public status: ApplicationStatus,
        public version: number,
        public isCurrent: boolean,
        public readonly createdBy: string | null,
        public changeReason: string | null,
        public submittedAt: Date | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
        public deletedAt: Date | null = null
    ) {}

    public updateStatus(newStatus: ApplicationStatus, reason?: string | null) {
        this.status = newStatus;
        if (reason !== undefined) {
            this.changeReason = reason;
        }
        if (newStatus === 'SUBMITTED') {
            this.submittedAt = new Date();
        }
        this.updatedAt = new Date();
    }

    public incrementVersion(reason?: string | null) {
        this.version += 1;
        if (reason !== undefined) {
            this.changeReason = reason;
        }
        this.updatedAt = new Date();
    }

    public softDelete() {
        this.deletedAt = new Date();
        this.updatedAt = new Date();
    }
}
