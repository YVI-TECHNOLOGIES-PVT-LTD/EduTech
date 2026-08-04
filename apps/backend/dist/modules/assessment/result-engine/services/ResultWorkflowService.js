"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultWorkflowService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const ResultRepository_1 = require("../repositories/ResultRepository");
const event_bus_service_1 = require("../../../../workflows/event-bus.service");
const supabase_1 = require("../../../../config/supabase");
class ResultWorkflowService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new ResultRepository_1.ResultRepository();
    }
    async transitionWorkflow(sessionId, schoolId, userId, targetStatus, comments, correlationId) {
        this.logInfo(`Transitioning result session: ${sessionId} to status: ${targetStatus}`, correlationId);
        const session = await this.repo.findSessionById(sessionId, schoolId);
        if (!session)
            throw new Error('Result session context not found.');
        const currentStatus = session.status;
        const allowedTransitions = {
            'DRAFT': ['CALCULATED'],
            'CALCULATED': ['UNDER_VERIFICATION'],
            'UNDER_VERIFICATION': ['APPROVED', 'DRAFT'],
            'APPROVED': ['PUBLISHED', 'LOCKED'],
            'PUBLISHED': ['LOCKED'],
            'LOCKED': []
        };
        const allowed = allowedTransitions[currentStatus] || [];
        if (!allowed.includes(targetStatus) && targetStatus !== 'LOCKED') {
            throw new Error(`Invalid status transition from "${currentStatus}" to "${targetStatus}"`);
        }
        const updated = await this.repo.updateStatus(sessionId, targetStatus);
        // Audit workflow logs mapping
        await supabase_1.supabase
            .from('assessment_result_approval_workflow')
            .insert({
            session_id: sessionId,
            approved_by: userId,
            role_level: 'APPROVER',
            decision: targetStatus === 'APPROVED' ? 'APPROVED' : 'PENDING',
            comments: comments || 'Workflow checklist transition'
        });
        // Publish events
        if (targetStatus === 'LOCKED') {
            await event_bus_service_1.EventBus.publish('ResultLocked', { sessionId, schoolId, userId });
        }
        else if (targetStatus === 'APPROVED') {
            await event_bus_service_1.EventBus.publish('ResultApproved', { sessionId, schoolId, userId });
        }
        return updated;
    }
}
exports.ResultWorkflowService = ResultWorkflowService;
exports.default = ResultWorkflowService;
