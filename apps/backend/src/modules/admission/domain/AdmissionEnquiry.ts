export type EnquirySource = 'Website' | 'Phone' | 'Walk-in' | 'Campaign' | 'Referral';
export type EnquiryStatus = 'new' | 'converted' | 'lost';

export class AdmissionEnquiry {
    constructor(
        public readonly id: string,
        public readonly schoolId: string,
        public readonly academicYearId: string,
        public readonly studentName: string,
        public readonly gradeAppliedFor: string,
        public readonly parentName: string,
        public readonly parentEmail: string,
        public readonly parentPhone: string,
        public readonly source: EnquirySource,
        public status: EnquiryStatus,
        public readonly createdAt: Date,
        public updatedAt: Date,
        public deletedAt: Date | null = null,
        public readonly dateOfBirth: Date | null = null,
        public readonly gender: string | null = null,
        public readonly currentSchool: string | null = null,
        public readonly address: string | null = null,
        public readonly remarks: string | null = null
    ) {}

    public convert() {
        this.status = 'converted';
        this.updatedAt = new Date();
    }

    public lose() {
        this.status = 'lost';
        this.updatedAt = new Date();
    }

    public softDelete() {
        this.deletedAt = new Date();
        this.updatedAt = new Date();
    }
}
