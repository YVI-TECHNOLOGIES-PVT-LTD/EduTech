export type SelectionStatus = 'SELECTED' | 'WAITLISTED' | 'RESERVED' | 'REJECTED';

export class MeritResult {
    constructor(
        public readonly id: string,
        public readonly applicationId: string,
        public readonly finalScore: number,
        public readonly rank: number,
        public readonly selectionStatus: SelectionStatus,
        public readonly waitlistPriority: number | null,
        public readonly waitlistGroup: string | null,
        public readonly recommendation: string | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) {}
}
