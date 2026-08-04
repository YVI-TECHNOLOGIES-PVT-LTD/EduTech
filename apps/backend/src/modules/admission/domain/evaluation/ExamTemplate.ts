export class ExamTemplate {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly grade: string,
        public readonly duration: number,
        public readonly totalMarks: number,
        public readonly passingMarks: number,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) {}
}
