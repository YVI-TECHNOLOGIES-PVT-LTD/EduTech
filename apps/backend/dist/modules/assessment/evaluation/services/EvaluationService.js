"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const EvaluationRepository_1 = require("../repositories/EvaluationRepository");
const supabase_1 = require("../../../../config/supabase");
class EvaluationService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new EvaluationRepository_1.EvaluationRepository();
    }
    async startEvaluationSession(schoolId, userId, payload, correlationId) {
        this.logInfo(`Starting evaluation session for attempt: ${payload.attempt_id}`, correlationId);
        // Check if there is an active lock for this attempt
        const { data: activeLock } = await supabase_1.supabase
            .from('assessment_evaluation_locks')
            .select('*')
            .eq('evaluation_session_id', payload.attempt_id)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();
        if (activeLock && activeLock.evaluator_id !== userId) {
            throw new Error('This attempt script is currently locked by another evaluator.');
        }
        // Create new session
        const session = await this.repo.createSession(schoolId, {
            assignment_id: payload.assignment_id || null,
            published_paper_id: payload.published_paper_id,
            attempt_id: payload.attempt_id,
            evaluator_id: userId,
            status: 'UNDER_EVALUATION'
        });
        // Set evaluation lock for 30 minutes
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);
        await supabase_1.supabase
            .from('assessment_evaluation_locks')
            .insert({
            evaluation_session_id: session.id,
            evaluator_id: userId,
            expires_at: expiresAt.toISOString()
        });
        return session;
    }
    async evaluateQuestion(sessionId, schoolId, userId, payload, correlationId) {
        this.logInfo(`Scoring question: ${payload.question_snapshot_id} in session: ${sessionId}`, correlationId);
        const session = await this.repo.findSessionById(sessionId, schoolId);
        if (!session)
            throw new Error('Evaluation session not found.');
        if (session.status === 'LOCKED')
            throw new Error('Cannot edit scored items on a locked session.');
        const res = await this.repo.saveQuestionEvaluation(sessionId, payload, userId);
        // Audit Trail log
        await supabase_1.supabase
            .from('assessment_evaluation_logs')
            .insert({
            session_id: sessionId,
            action: 'QUESTION_EVALUATED',
            before_state: {},
            after_state: { question_snapshot_id: payload.question_snapshot_id, awarded_marks: payload.awarded_marks },
            evaluator_id: userId
        });
        return res;
    }
}
exports.EvaluationService = EvaluationService;
exports.default = EvaluationService;
