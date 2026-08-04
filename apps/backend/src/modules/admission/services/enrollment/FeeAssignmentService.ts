import { FeeRepository } from '../../repositories/enrollment/FeeRepository';
import { FeeAssignment } from '../../domain/enrollment/FeeAssignment';
import { AuditService } from '../AuditService';

export class FeeAssignmentService {
    constructor(
        private readonly feeRepo: FeeRepository,
        private readonly auditService: AuditService
    ) {}

    public async assignStructure(
        applicationId: string,
        structureId: string,
        performedBy: string | null,
        correlationId?: string
    ): Promise<FeeAssignment[]> {
        const existing = await this.feeRepo.findAssignmentsByApplicationId(applicationId);
        if (existing && existing.length > 0) {
            console.log(`[FeeAssignmentService] Idempotency triggered: returning existing assignments for application ${applicationId}`);
            return existing;
        }

        const components = await this.feeRepo.findComponentsByStructureId(structureId);
        if (!components || components.length === 0) {
            throw new Error(`No components found under Fee Structure template ID ${structureId}`);
        }

        const assignments: FeeAssignment[] = [];
        for (const comp of components) {
            const assignment = new FeeAssignment(
                crypto.randomUUID(),
                applicationId,
                comp.id,
                comp.amount,
                0,
                0,
                new Date()
            );
            await this.feeRepo.saveAssignment(assignment);
            assignments.push(assignment);
        }

        // Audit Trail log
        await this.auditService.logAudit({
            action: 'FEE_STRUCTURE_ASSIGNED',
            entityName: 'admission_fee_assignments',
            entityId: applicationId,
            afterState: { structureId, componentsCount: assignments.length },
            userId: performedBy,
            correlationId
        });

        return assignments;
    }
}
