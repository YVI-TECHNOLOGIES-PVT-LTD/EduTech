export class EnquiryCreated {
    constructor(
        public readonly enquiryId: string,
        public readonly schoolId: string,
        public readonly academicYearId: string,
        public readonly studentName: string,
        public readonly parentEmail: string,
        public readonly parentPhone: string,
        public readonly timestamp: Date = new Date()
    ) {}
}

export class LeadCreated {
    constructor(
        public readonly leadId: string,
        public readonly enquiryId: string | null,
        public readonly status: string,
        public readonly timestamp: Date = new Date()
    ) {}
}

export class FeatureFlagUpdated {
    constructor(
        public readonly featureKey: string,
        public readonly module: string,
        public readonly enabled: boolean,
        public readonly environment: string,
        public readonly tenantId: string | null,
        public readonly timestamp: Date = new Date()
    ) {}
}

export class AdmissionSoftDeleted {
    constructor(
        public readonly admissionId: string,
        public readonly deletedAt: Date = new Date()
    ) {}
}
