export class MeritRule {
    constructor(
        public readonly id: string,
        public readonly schoolId: string,
        public readonly academicYearId: string,
        public readonly tieBreakerRules: string[],
        public readonly createdAt: Date
    ) {}
}

export class MeritComponent {
    constructor(
        public readonly id: string,
        public readonly ruleId: string,
        public readonly componentName: string,
        public readonly weight: number,
        public readonly active: boolean
    ) {}
}
