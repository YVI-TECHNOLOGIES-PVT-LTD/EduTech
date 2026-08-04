export class ExamResult {
    constructor(
        public readonly id: string,
        public readonly candidateId: string,
        public readonly subjectId: string,
        public readonly marksObtained: number,
        public readonly percentage: number,
        public readonly pass: boolean,
        public readonly evaluatorId: string | null,
        public readonly createdAt: Date,
        public updatedAt: Date
    ) {}
}
