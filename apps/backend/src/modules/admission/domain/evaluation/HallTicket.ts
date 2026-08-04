export class HallTicket {
    constructor(
        public readonly id: string,
        public readonly applicationId: string,
        public readonly examScheduleId: string,
        public readonly hallTicketNumber: string,
        public readonly examRoom: string,
        public readonly reportingTime: Date,
        public readonly qrCodePath: string | null,
        public readonly createdAt: Date
    ) {}
}
