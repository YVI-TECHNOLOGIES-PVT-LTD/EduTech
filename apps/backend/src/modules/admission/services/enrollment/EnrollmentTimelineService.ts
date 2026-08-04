import { EnrollmentRepository } from '../../repositories/enrollment/EnrollmentRepository';

export class EnrollmentTimelineService {
    constructor(private readonly enrollRepo: EnrollmentRepository) {}

    public async logAction(
        applicationId: string,
        action: string,
        details: string,
        performedBy: string | null
    ): Promise<void> {
        await this.enrollRepo.logEnrollmentAction(applicationId, action, details, performedBy);
    }
}
