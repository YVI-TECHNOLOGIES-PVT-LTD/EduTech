export type StudentStatus = 'NEW' | 'ACTIVE' | 'PROMOTED' | 'SUSPENDED' | 'TRANSFERRED' | 'LEFT' | 'ALUMNI';

export class Student {
    constructor(
        public readonly id: string,
        public readonly userId: string | null,
        public readonly admissionNo: string,
        public readonly firstName: string,
        public readonly lastName: string,
        public status: StudentStatus,
        public readonly schoolId: string,
        public readonly academicYearId: string,
        public readonly createdAt: Date,
        public updatedAt: Date,
        public deletedAt: Date | null = null
    ) {}

    public transitionStatus(newStatus: StudentStatus) {
        this.status = newStatus;
        this.updatedAt = new Date();
    }

    public softDelete() {
        this.deletedAt = new Date();
        this.updatedAt = new Date();
    }
}
