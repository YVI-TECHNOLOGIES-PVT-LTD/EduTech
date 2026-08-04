export class ApplicationProfile {
    constructor(
        public readonly id: string,
        public readonly applicationId: string,
        public readonly dateOfBirth: Date,
        public readonly gender: string,
        public readonly bloodGroup: string | null,
        public readonly nationality: string | null,
        public readonly religion: string | null,
        public readonly category: string | null,
        public readonly aadhaar: string | null,
        public readonly photoUrl: string | null,
        public readonly allergies: string | null,
        public readonly medicalConditions: string | null,
        public readonly emergencyNotes: string | null,
        public readonly createdAt: Date,
        public updatedAt: Date
    ) {}

    public update(data: Partial<ApplicationProfile>) {
        Object.assign(this, {
            ...data,
            updatedAt: new Date()
        });
    }
}
