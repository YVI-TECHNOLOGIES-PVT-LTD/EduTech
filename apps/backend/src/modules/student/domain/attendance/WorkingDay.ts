export class WorkingDay {
    constructor(
        public readonly id: string,
        public readonly schoolId: string,
        public readonly academicYearId: string,
        public readonly grade: string,
        public readonly month: number,
        public readonly totalWorkingDays: number,
        public readonly createdAt: Date
    ) {}
}
