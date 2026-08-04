export class DocumentChecklist {
    constructor(
        public readonly id: string,
        public readonly schoolId: string,
        public readonly academicYearId: string,
        public readonly grade: string,
        public readonly admissionType: string,
        public readonly documentTypeId: string,
        public readonly mandatory: boolean,
        public readonly minimumCopies: number
    ) {}
}
