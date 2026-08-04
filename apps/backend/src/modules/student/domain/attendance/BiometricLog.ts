export class BiometricLog {
    constructor(
        public readonly id: string,
        public readonly deviceCode: string,
        public readonly studentAdmissionNo: string,
        public readonly scanTimestamp: Date,
        public readonly status: 'UNPROCESSED' | 'PROCESSED' | 'FAILED',
        public readonly failureReason: string | null,
        public readonly createdAt: Date
    ) {}
}
