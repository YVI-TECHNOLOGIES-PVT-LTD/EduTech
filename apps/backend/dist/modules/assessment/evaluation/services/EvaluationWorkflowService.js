"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationWorkflowService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const EvaluationRepository_1 = require("../repositories/EvaluationRepository");
const event_bus_service_1 = require("../../../../workflows/event-bus.service");
const supabase_1 = require("../../../../config/supabase");
class EvaluationWorkflowService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new EvaluationRepository_1.EvaluationRepository();
    }
    async transitionSessionWorkflow(sessionId, schoolId, userId, targetStatus, correlationId) {
        this.logInfo(`Transitioning session: ${sessionId} status to: ${targetStatus}`, correlationId);
        const session = await this.repo.findSessionById(sessionId, schoolId);
        if (!session)
            throw new Error('Session not found.');
        // Allowable state mappings transitions
        const allowedTransitions = {
            'DRAFT': ['AUTO_GRADED', 'UNDER_EVALUATION', 'LOCKED'],
            'AUTO_GRADED': ['UNDER_EVALUATION', 'UNDER_MODERATION', 'FINALIZED'],
            'UNDER_EVALUATION': ['UNDER_MODERATION', 'FINALIZED'],
            'UNDER_MODERATION': ['FINALIZED', 'RE_EVALUATION'],
            'RE_EVALUATION': ['FINALIZED'],
            'FINALIZED': ['PUBLISHED', 'LOCKED'],
            'PUBLISHED': ['LOCKED'],
            'LOCKED': []
        };
        const currentStatus = session.status;
        const allowed = allowedTransitions[currentStatus] || [];
        if (!allowed.includes(targetStatus) && targetStatus !== 'LOCKED') {
            throw new Error(`Invalid status transition from: "${currentStatus}" to: "${targetStatus}"`);
        }
        const updated = await this.repo.updateSessionStatus(sessionId, targetStatus);
        // Publish events
        if (targetStatus === 'LOCKED') {
            await event_bus_service_1.EventBus.publish('EvaluationLocked', { sessionId, schoolId, userId });
        }
        else if (targetStatus === 'PUBLISHED') {
            await event_bus_service_1.EventBus.publish('EvaluationPublished', { sessionId, schoolId, userId });
        }
        // Release lock
        await supabase_1.supabase
            .from('assessment_evaluation_locks')
            .delete()
            .eq('evaluation_session_id', sessionId);
        return updated;
    }
}
exports.EvaluationWorkflowService = EvaluationWorkflowService;
exports.default = EvaluationWorkflowService;
