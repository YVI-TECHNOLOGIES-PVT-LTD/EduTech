export class InterviewScore {
    constructor(
        public readonly id: string,
        public readonly interviewId: string,
        public readonly criterionId: string,
        public readonly score: number,
        public readonly remarks: string | null,
        public readonly createdAt: Date
    ) {}
}
