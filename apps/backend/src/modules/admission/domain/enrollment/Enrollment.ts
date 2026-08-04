export class Enrollment {
    constructor(
        public readonly id: string,
        public readonly applicationId: string,
        public readonly studentId: string,
        public readonly admissionNumber: string,
        public readonly enrolledAt: Date,
        public readonly enrolledBy: string | null
    ) {}
}
