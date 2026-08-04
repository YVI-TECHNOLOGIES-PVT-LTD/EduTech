import { ApplicationRepository } from '../../../repositories/application/ApplicationRepository';
import { ConflictError } from '../../../errors/ConflictError';

export class DuplicateValidator {
    constructor(private readonly appRepo: ApplicationRepository) {}

    public async validate(
        leadId: string,
        studentName: string,
        dateOfBirth: Date,
        academicYearId: string,
        excludeApplicationId?: string
    ): Promise<void> {
        // 1. Check if this lead already has an application
        const existingByLead = await this.appRepo.findCurrentByLeadId(leadId);
        if (existingByLead && existingByLead.id !== excludeApplicationId) {
            throw new ConflictError(
                'This student already has an active admission application for the selected academic year.'
            );
        }

        // 2. Check if another student with the same name and DOB has a registered application for this academic year
        const existingByName = await this.appRepo.findCurrentByDetails(studentName, dateOfBirth, academicYearId);
        if (existingByName && existingByName.id !== excludeApplicationId) {
            throw new ConflictError(
                'This student already has an active admission application for the selected academic year.'
            );
        }
    }
}
