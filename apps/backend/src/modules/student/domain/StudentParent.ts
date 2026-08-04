export class StudentParent {
    constructor(
        public readonly id: string,
        public readonly studentId: string,
        public readonly parentName: string,
        public readonly relation: 'Father' | 'Mother' | 'Stepfather' | 'Stepmother',
        public readonly mobileNumber: string | null,
        public readonly email: string | null,
        public readonly occupation: string | null,
        public readonly aadhaar: string | null,
        public readonly createdAt: Date
    ) {}
}
