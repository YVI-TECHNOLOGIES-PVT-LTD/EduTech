"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateWorkflowService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const template_repository_1 = require("../repositories/template.repository");
const TemplateValidator_1 = require("../validators/TemplateValidator");
const AuditService_1 = require("../../../admission/services/AuditService");
const event_bus_service_1 = require("../../../../workflows/event-bus.service");
const BusinessRuleError_1 = require("../../../admission/errors/BusinessRuleError");
const supabase_1 = require("../../../../config/supabase");
class TemplateWorkflowService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new template_repository_1.TemplateRepository();
        this.audit = new AuditService_1.AuditService();
    }
    async transitionStatus(templateId, schoolId, userId, payload, correlationId) {
        const validated = TemplateValidator_1.TemplateValidator.validateWorkflow(payload);
        this.logInfo(`Transitioning template: ${templateId} status to: ${validated.target_status}`, correlationId);
        const template = await this.repo.findTemplateById(templateId, schoolId);
        if (!template)
            throw new Error('Template context not found.');
        const currentStatus = template.status;
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
        const { data, error } = await supabase_1.supabase
            .from('assessment_templates')
            .update({
            status: targetStatus,
            updated_at: new Date().toISOString()
        })
            .eq('id', templateId)
            .select()
            .single();
        if (error)
            throw error;
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_TEMPLATE_WORKFLOW_TRANSITION',
            entityName: 'assessment_templates',
            entityId: templateId,
            beforeState: { id: templateId, status: currentStatus },
            afterState: { id: templateId, status: targetStatus, reason: validated.transition_reason },
            correlationId
        });
        // Publish Events
        if (targetStatus === 'PUBLISHED') {
            await event_bus_service_1.EventBus.publish('TemplatePublished', { templateId, schoolId, userId });
        }
        else if (targetStatus === 'ARCHIVED') {
            await event_bus_service_1.EventBus.publish('TemplateArchived', { templateId, schoolId, userId });
        }
        return data;
    }
}
exports.TemplateWorkflowService = TemplateWorkflowService;
exports.default = TemplateWorkflowService;
