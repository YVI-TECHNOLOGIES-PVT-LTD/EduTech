export class AdmissionApplication {
    constructor(
        public readonly id: string,
        public readonly schoolId: string,
        public readonly academicYearId: string,
        public readonly applicantUserId: string | null,
        public readonly studentName: string,
        public readonly dateOfBirth: Date,
        public readonly gender: 'Male' | 'Female' | 'Other',
        public readonly gradeAppliedFor: string,
        public status: string,
        public readonly createdAt: Date,
        public updatedAt: Date,
        public deletedAt: Date | null = null
    ) {}

    public updateStatus(status: string) {
        this.status = status;
        this.updatedAt = new Date();
    }

    public softDelete() {
        this.deletedAt = new Date();
        this.updatedAt = new Date();
    }
}
