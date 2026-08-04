export class Holiday {
    constructor(
        public readonly id: string,
        public readonly schoolId: string,
        public readonly holidayDate: Date,
        public readonly name: string,
        public readonly description: string | null,
        public readonly createdAt: Date
    ) {}
}
