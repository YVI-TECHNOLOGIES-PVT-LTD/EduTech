export class StudentPromotion {
    constructor(
        public readonly id: string,
        public readonly studentId: string,
        public readonly fromAcademicYearId: string,
        public readonly toAcademicYearId: string,
        public readonly fromGrade: string,
        public readonly toGrade: string,
        public readonly fromSectionId: string | null,
        public readonly toSectionId: string | null,
        public readonly promotedBy: string | null,
        public readonly promotedAt: Date,
        public readonly promotionReason: string
    ) {}
}
