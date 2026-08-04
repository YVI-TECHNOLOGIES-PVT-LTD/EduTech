"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlueprintWorkflowService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const BlueprintRepository_1 = require("../repositories/BlueprintRepository");
const BlueprintValidator_1 = require("../validators/BlueprintValidator");
const BlueprintVersionRepository_1 = require("../repositories/BlueprintVersionRepository");
const AuditService_1 = require("../../../admission/services/AuditService");
const event_bus_service_1 = require("../../../../workflows/event-bus.service");
const BusinessRuleError_1 = require("../../../admission/errors/BusinessRuleError");
const supabase_1 = require("../../../../config/supabase");
class BlueprintWorkflowService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.blueprintRepo = new BlueprintRepository_1.BlueprintRepository();
        this.versionRepo = new BlueprintVersionRepository_1.BlueprintVersionRepository();
        this.audit = new AuditService_1.AuditService();
    }
    async transitionStatus(blueprintId, schoolId, userId, payload, correlationId) {
        const validated = BlueprintValidator_1.BlueprintValidator.validateWorkflow(payload);
        this.logInfo(`Transitioning status of blueprint: ${blueprintId} to status: ${validated.target_status}`, correlationId);
        const blueprint = await this.blueprintRepo.findBlueprintById(blueprintId, schoolId);
        if (!blueprint) {
            throw new BusinessRuleError_1.BusinessRuleError('Blueprint header context not found.');
        }
        const currentStatus = blueprint.status;
        const targetStatus = validated.target_status;
        // Verify valid transitions
        const allowedTransitions = {
            'DRAFT': ['UNDER_REVIEW', 'ARCHIVED'],
            'UNDER_REVIEW': ['APPROVED', 'DRAFT'],
            'APPROVED': ['PUBLISHED', 'ARCHIVED'],
            'PUBLISHED': ['ARCHIVED'],
            'ARCHIVED': ['DRAFT']
        };
        const allowed = allowedTransitions[currentStatus] || [];
        if (!allowed.includes(targetStatus)) {
            throw new BusinessRuleError_1.BusinessRuleError(`Transition from "${currentStatus}" to "${targetStatus}" is not allowed.`);
        }
        // Create a snapshot version if we transition to APPROVED or PUBLISHED
        if (targetStatus === 'PUBLISHED' || targetStatus === 'APPROVED') {
            await this.versionRepo.createVersion(blueprintId, blueprint.version, blueprint);
        }
        // Update status
        const { data, error } = await supabase_1.supabase
            .from('assessment_blueprints')
            .update({
            status: targetStatus,
            updated_at: new Date().toISOString()
        })
            .eq('id', blueprintId)
            .select()
            .single();
        if (error)
            throw error;
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_BLUEPRINT_WORKFLOW_TRANSITION',
            entityName: 'assessment_blueprints',
            entityId: blueprintId,
            beforeState: { id: blueprintId, status: currentStatus },
            afterState: { id: blueprintId, status: targetStatus, reason: validated.transition_reason },
            correlationId
        });
        // Publish Events
        if (targetStatus === 'PUBLISHED') {
            await event_bus_service_1.EventBus.publish('BlueprintPublished', { blueprintId, schoolId, userId });
        }
        else if (targetStatus === 'ARCHIVED') {
            await event_bus_service_1.EventBus.publish('BlueprintArchived', { blueprintId, schoolId, userId });
        }
        return data;
    }
}
exports.BlueprintWorkflowService = BlueprintWorkflowService;
exports.default = BlueprintWorkflowService;
