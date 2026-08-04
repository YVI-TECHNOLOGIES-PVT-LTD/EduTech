export class AttendanceSession {
    constructor(
        public readonly id: string,
        public readonly schoolId: string,
        public readonly academicYearId: string,
        public readonly grade: string,
        public readonly sectionId: string,
        public readonly date: Date,
        public status: 'OPEN' | 'CLOSED',
        public readonly createdBy: string | null,
        public readonly createdAt: Date
    ) {}

    public closeSession() {
        this.status = 'CLOSED';
    }
}
