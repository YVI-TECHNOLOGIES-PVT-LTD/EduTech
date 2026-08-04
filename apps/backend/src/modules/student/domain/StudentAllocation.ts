export class StudentAllocation {
    constructor(
        public readonly id: string,
        public readonly studentId: string,
        public readonly academicYearId: string,
        public readonly grade: string,
        public readonly sectionId: string,
        public readonly rollNumber: number,
        public readonly allocatedAt: Date
    ) {}
}
