"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeAssignmentService = void 0;
const FeeAssignment_1 = require("../../domain/enrollment/FeeAssignment");
class FeeAssignmentService {
    constructor(feeRepo, auditService) {
        this.feeRepo = feeRepo;
        this.auditService = auditService;
    }
    async assignStructure(applicationId, structureId, performedBy, correlationId) {
        const existing = await this.feeRepo.findAssignmentsByApplicationId(applicationId);
        if (existing && existing.length > 0) {
            console.log(`[FeeAssignmentService] Idempotency triggered: returning existing assignments for application ${applicationId}`);
            return existing;
        }
        const components = await this.feeRepo.findComponentsByStructureId(structureId);
        if (!components || components.length === 0) {
            throw new Error(`No components found under Fee Structure template ID ${structureId}`);
        }
        const assignments = [];
        for (const comp of components) {
            const assignment = new FeeAssignment_1.FeeAssignment(crypto.randomUUID(), applicationId, comp.id, comp.amount, 0, 0, new Date());
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
exports.FeeAssignmentService = FeeAssignmentService;
