"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperWorkflowService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const PaperRepository_1 = require("../repositories/PaperRepository");
const PaperPublishingService_1 = require("./PaperPublishingService");
const AuditService_1 = require("../../../admission/services/AuditService");
const event_bus_service_1 = require("../../../../workflows/event-bus.service");
const BusinessRuleError_1 = require("../../../admission/errors/BusinessRuleError");
class PaperWorkflowService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new PaperRepository_1.PaperRepository();
        this.publishingService = new PaperPublishingService_1.PaperPublishingService();
        this.audit = new AuditService_1.AuditService();
    }
    async transitionStatus(paperId, schoolId, userId, targetStatus, reason, correlationId) {
        this.logInfo(`Transitioning generated paper: ${paperId} status to: ${targetStatus}`, correlationId);
        const paper = await this.repo.findPaperById(paperId, schoolId);
        if (!paper)
            throw new Error('Paper context not found.');
        const currentStatus = paper.status;
        // Verify valid transitions
        const allowedTransitions = {
            'DRAFT': ['GENERATED', 'CANCELLED'],
            'GENERATED': ['VALIDATED', 'CANCELLED'],
            'VALIDATED': ['APPROVED', 'CANCELLED'],
            'APPROVED': ['PUBLISHED', 'CANCELLED'],
            'PUBLISHED': ['ARCHIVED'],
            'ARCHIVED': ['DRAFT']
        };
        const allowed = allowedTransitions[currentStatus] || [];
        if (!allowed.includes(targetStatus)) {
            throw new BusinessRuleError_1.BusinessRuleError(`Transition from "${currentStatus}" to "${targetStatus}" is not allowed.`);
        }
        const updated = await this.repo.updatePaper(paperId, schoolId, { status: targetStatus });
        // If targetStatus is PUBLISHED, generate the immutable aggregates snapshot
        if (targetStatus === 'PUBLISHED') {
            await this.publishingService.publishGeneratedPaper(paperId, schoolId, userId, correlationId);
            await event_bus_service_1.EventBus.publish('PaperPublished', { paperId, schoolId, userId });
        }
        else {
            await event_bus_service_1.EventBus.publish('PaperGenerated', { paperId, schoolId, userId });
        }
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_PAPER_WORKFLOW_TRANSITION',
            entityName: 'assessment_generated_papers',
            entityId: paperId,
            beforeState: { status: currentStatus },
            afterState: { status: targetStatus, reason },
            correlationId
        });
        return updated;
    }
}
exports.PaperWorkflowService = PaperWorkflowService;
exports.default = PaperWorkflowService;
