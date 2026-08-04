import { DocumentRepository } from '../../../repositories/application/DocumentRepository';
import { DocumentChecklistRepository } from '../../../repositories/application/DocumentChecklistRepository';
import { ApplicationRepository } from '../../../repositories/application/ApplicationRepository';
import { BusinessRuleError } from '../../../errors/BusinessRuleError';

export class DocumentValidator {
    constructor(
        private readonly docRepo: DocumentRepository,
        private readonly checklistRepo: DocumentChecklistRepository,
        private readonly appRepo: ApplicationRepository
    ) {}

    public async validate(applicationId: string): Promise<void> {
        const app = await this.appRepo.findById(applicationId);
        if (!app) {
            throw new Error(`Application with ID ${applicationId} not found`);
        }

        // Get checklists required for this application's school + year + grade
        const grade = await this.appRepo.getGradeForApplication(applicationId);
        const checklist = await this.checklistRepo.findByGrade(
            app.schoolId,
            app.academicYearId,
            grade
        );

        // Fetch documents uploaded for this application
        const docs = await this.docRepo.findByApplicationId(applicationId);

        // For each mandatory checklist item, verify that it exists and is VERIFIED
        const mandatoryRules = checklist.filter(c => c.mandatory);
        for (const rule of mandatoryRules) {
            const uploaded = docs.find(d => d.documentTypeId === rule.documentTypeId);
            if (!uploaded) {
                throw new BusinessRuleError(
                    `Mandatory document with Type ID "${rule.documentTypeId}" is missing.`
                );
            }
            if (uploaded.status !== 'VERIFIED') {
                throw new BusinessRuleError(
                    `Mandatory document with Type ID "${rule.documentTypeId}" has status "${uploaded.status}". Must be VERIFIED.`
                );
            }
        }
    }
}
