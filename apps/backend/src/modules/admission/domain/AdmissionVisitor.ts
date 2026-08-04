export type VisitType = 'Walk-in' | 'Campus Tour' | 'Meeting' | 'Admission Inquiry' | 'Parent Meeting';

export class AdmissionVisitor {
    constructor(
        public readonly id: string,
        public readonly schoolId: string,
        public readonly visitorName: string,
        public readonly phone: string,
        public readonly purpose: string,
        public readonly timeIn: Date,
        public timeOut: Date | null,
        public readonly leadId: string | null,
        public readonly createdBy: string,
        public readonly createdAt: Date,
        public readonly counselorId: string | null = null,
        public readonly remarks: string | null = null,
        public readonly visitType: VisitType | null = null,
        public visitOutcome: string | null = null
    ) {}

    public checkOut(outcome: string | null = null) {
        this.timeOut = new Date();
        if (outcome) {
            this.visitOutcome = outcome;
        }
    }
}
