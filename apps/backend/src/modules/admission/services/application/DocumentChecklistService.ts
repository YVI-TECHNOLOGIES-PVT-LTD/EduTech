import { DocumentChecklistRepository } from '../../repositories/application/DocumentChecklistRepository';
import { DocumentChecklist } from '../../domain/DocumentChecklist';

export class DocumentChecklistService {
    constructor(private readonly checklistRepo: DocumentChecklistRepository) {}

    /**
     * Lists the checklist rules mapped to a specific grade.
     */
    public async getChecklist(
        schoolId: string,
        academicYearId: string,
        grade: string
    ): Promise<DocumentChecklist[]> {
        return this.checklistRepo.findByGrade(schoolId, academicYearId, grade);
    }
}
