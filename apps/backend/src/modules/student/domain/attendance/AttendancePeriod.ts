export class AttendancePeriod {
    constructor(
        public readonly id: string,
        public readonly studentId: string,
        public readonly academicYearId: string,
        public readonly date: Date,
        public readonly periodNumber: number,
        public readonly subjectId: string | null,
        public readonly status: 'PRESENT' | 'ABSENT' | 'LATE',
        public readonly markedBy: string | null,
        public readonly markedAt: Date
    ) {}
}
