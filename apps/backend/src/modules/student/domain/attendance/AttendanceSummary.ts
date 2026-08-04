export class AttendanceSummary {
    constructor(
        public readonly id: string,
        public readonly studentId: string,
        public readonly academicYearId: string,
        public readonly month: number,
        public readonly totalPresent: number,
        public readonly totalAbsent: number,
        public readonly totalLate: number,
        public readonly attendancePercentage: number,
        public readonly lastCalculated: Date
    ) {}
}
