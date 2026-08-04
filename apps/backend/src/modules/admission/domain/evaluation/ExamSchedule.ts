export type ExamStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'EVALUATED';

export class ExamSchedule {
    constructor(
        public readonly id: string,
        public readonly templateId: string,
        public readonly schoolId: string,
        public readonly academicYearId: string,
        public readonly roomName: string,
        public readonly invigilatorName: string,
        public readonly examDate: Date,
        public status: ExamStatus,
        public readonly createdAt: Date,
        public updatedAt: Date
    ) {}

    public transition(newStatus: ExamStatus) {
        this.status = newStatus;
        this.updatedAt = new Date();
    }
}
