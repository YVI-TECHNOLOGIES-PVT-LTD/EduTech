export class StudentAcademicRecord {
    constructor(
        public readonly id: string,
        public readonly studentId: string,
        public readonly academicYearId: string,
        public readonly grade: string,
        public readonly gpaOrMarks: string | null,
        public readonly remarks: string | null,
        public readonly createdAt: Date
    ) {}
}
