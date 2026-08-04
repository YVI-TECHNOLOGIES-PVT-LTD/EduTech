"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceWorkflowService = void 0;
const BaseService_1 = require("../../admission/services/BaseService");
const AttendanceSessionRepository_1 = require("../repositories/AttendanceSessionRepository");
const supabase_1 = require("../../../config/supabase");
class AttendanceWorkflowService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new AttendanceSessionRepository_1.AttendanceSessionRepository();
    }
    async transitionSessionWorkflow(sessionId, decision, userId, comments, correlationId) {
        this.logInfo(`Transitioning attendance session workflow to: ${decision}`, correlationId);
        let targetStatus = 'DRAFT';
        if (decision === 'SUBMITTED')
            targetStatus = 'SUBMITTED';
        if (decision === 'APPROVED')
            targetStatus = 'APPROVED';
        const session = await this.repo.updateStatus(sessionId, targetStatus);
        // Save session locks if status is approved/locked
        if (targetStatus === 'APPROVED') {
            await this.repo.updateStatus(sessionId, 'LOCKED');
            await supabase_1.supabase
                .from('attendance_session_locks')
                .insert({
                session_id: sessionId,
                locked_by: userId,
                reason: 'Workflow approval checklist complete.'
            });
        }
        // Insert workflow audit log
        await supabase_1.supabase
            .from('attendance_session_workflow')
            .insert({
            session_id: sessionId,
            approved_by: userId,
            role_level: 'HOD',
            decision,
            comments: comments || 'Workflow checklist check'
        });
        return session;
    }
}
exports.AttendanceWorkflowService = AttendanceWorkflowService;
exports.default = AttendanceWorkflowService;
