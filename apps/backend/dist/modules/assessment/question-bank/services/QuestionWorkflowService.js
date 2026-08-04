"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionWorkflowService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const question_repository_1 = require("../repositories/question.repository");
const QuestionValidator_1 = require("../validators/QuestionValidator");
const AuditService_1 = require("../../../admission/services/AuditService");
const event_bus_service_1 = require("../../../../workflows/event-bus.service");
const BusinessRuleError_1 = require("../../../admission/errors/BusinessRuleError");
const supabase_1 = require("../../../../config/supabase");
class QuestionWorkflowService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.questionRepo = new question_repository_1.QuestionRepository();
        this.audit = new AuditService_1.AuditService();
    }
    async transitionStatus(questionId, schoolId, userId, payload, correlationId) {
        const validated = QuestionValidator_1.QuestionValidator.validateWorkflow(payload);
        this.logInfo(`Transitioning status of question: ${questionId} to: ${validated.target_status}`, correlationId);
        const question = await this.questionRepo.findQuestionById(questionId, schoolId);
        if (!question) {
            throw new BusinessRuleError_1.BusinessRuleError('Question context not found.');
        }
        const currentStatus = question.status;
        const targetStatus = validated.target_status;
        // Verify valid transition
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
        // Update status in database
        const { data, error } = await supabase_1.supabase
            .from('assessment_question_bank')
            .update({
            status: targetStatus,
            updated_at: new Date().toISOString()
        })
            .eq('id', questionId)
            .select()
            .single();
        if (error)
            throw error;
        // Audit Log
        await this.audit.logAudit({
            userId,
            action: 'ASSESSMENT_QUESTION_WORKFLOW_TRANSITION',
            entityName: 'assessment_question_bank',
            entityId: questionId,
            beforeState: { id: questionId, status: currentStatus },
            afterState: { id: questionId, status: targetStatus, reason: validated.transition_reason },
            correlationId
        });
        // Publish Events
        if (targetStatus === 'UNDER_REVIEW') {
            await event_bus_service_1.EventBus.publish('QuestionReviewed', { questionId, schoolId, userId });
        }
        else if (targetStatus === 'APPROVED') {
            await event_bus_service_1.EventBus.publish('QuestionApproved', { questionId, schoolId, userId });
        }
        else if (targetStatus === 'PUBLISHED') {
            await event_bus_service_1.EventBus.publish('QuestionPublished', { questionId, schoolId, userId });
        }
        else if (targetStatus === 'ARCHIVED') {
            await event_bus_service_1.EventBus.publish('QuestionArchived', { questionId, schoolId, userId });
        }
        return data;
    }
}
exports.QuestionWorkflowService = QuestionWorkflowService;
exports.default = QuestionWorkflowService;
