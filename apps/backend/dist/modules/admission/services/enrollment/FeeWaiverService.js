"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeWaiverService = void 0;
const BusinessRuleError_1 = require("../../errors/BusinessRuleError");
class FeeWaiverService {
    constructor(feeRepo, auditService) {
        this.feeRepo = feeRepo;
        this.auditService = auditService;
    }
    async applyWaiver(applicationId, componentId, amount, remarks, approvedBy, correlationId) {
        const assignments = await this.feeRepo.findAssignmentsByApplicationId(applicationId);
        const item = assignments.find(a => a.componentId === componentId);
        if (!item) {
            throw new Error(`Fee assignment component with ID ${componentId} not found for this candidate`);
        }
        if (amount > item.outstandingAmount) {
            throw new BusinessRuleError_1.BusinessRuleError(`Waived amount (${amount}) exceeds candidate outstanding component balance (${item.outstandingAmount})`);
        }
        // Create waiver record
        const waiver = {
            id: crypto.randomUUID(),
            application_id: applicationId,
            component_id: componentId,
            amount,
            remarks,
            approved_by: approvedBy
        };
        await this.feeRepo.saveWaiver(waiver);
        // Apply waiver to assignment balance
        item.recordWaiver(amount);
        await this.feeRepo.saveAssignment(item);
        // Audit Trail log
        await this.auditService.logAudit({
            action: 'FEE_WAIVER_APPLIED',
            entityName: 'admission_fee_assignments',
            entityId: item.id,
            afterState: { waivedAmount: amount, remarks },
            userId: approvedBy,
            correlationId
        });
    }
}
exports.FeeWaiverService = FeeWaiverService;
