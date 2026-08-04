export class AdmissionFeeStructure {
    constructor(
        public readonly id: string,
        public readonly schoolId: string,
        public readonly grade: string,
        public readonly academicYearId: string,
        public readonly name: string,
        public readonly active: boolean
    ) {}
}

export class AdmissionFeeComponent {
    constructor(
        public readonly id: string,
        public readonly structureId: string,
        public readonly componentName: string,
        public readonly amount: number,
        public readonly mandatory: boolean
    ) {}
}
