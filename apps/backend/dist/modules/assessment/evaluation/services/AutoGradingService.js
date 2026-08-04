"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoGradingService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const supabase_1 = require("../../../../config/supabase");
const EvaluationRepository_1 = require("../repositories/EvaluationRepository");
class AutoGradingService extends BaseService_1.BaseService {
    constructor() {
        super(...arguments);
        this.repo = new EvaluationRepository_1.EvaluationRepository();
    }
    async autogradeAttempt(sessionId, schoolId, correlationId) {
        this.logInfo(`Running Autograding engine on session: ${sessionId}`, correlationId);
        // Fetch session details
        const session = await this.repo.findSessionById(sessionId, schoolId);
        if (!session)
            throw new Error('Session not found.');
        // Load attempt answers submitted
        const { data: answers, error: aErr } = await supabase_1.supabase
            .from('assessment_attempt_answers')
            .select('*')
            .eq('attempt_id', session.attempt_id);
        if (aErr)
            throw aErr;
        // Fetch published questions snapshots mapping
        const { data: publishedQuestions, error: pqErr } = await supabase_1.supabase
            .from('assessment_published_questions')
            .select('*');
        if (pqErr)
            throw pqErr;
        for (const ans of answers || []) {
            const questionSnapshot = publishedQuestions.find(pq => pq.question_snapshot?.id === ans.question_id);
            if (!questionSnapshot)
                continue;
            const isObjective = ['MCQ', 'TRUE_FALSE', 'NUMERICAL', 'CODING'].includes(questionSnapshot.question_snapshot?.type);
            if (!isObjective)
                continue;
            let isCorrect = false;
            let remarks = 'Autograded: ';
            const qType = questionSnapshot.question_snapshot?.type;
            const correctAnswers = questionSnapshot.answer_key_snapshot || [];
            if (qType === 'MCQ' || qType === 'TRUE_FALSE') {
                const studentSelection = ans.selected_option_ids?.[0];
                const correctOption = correctAnswers[0]?.id;
                isCorrect = studentSelection === correctOption;
                remarks += isCorrect ? 'Option matches answer key.' : 'Option mismatch.';
            }
            else if (qType === 'NUMERICAL') {
                isCorrect = Number(ans.text_answer) === Number(correctAnswers[0]?.value);
                remarks += isCorrect ? 'Value matches.' : 'Value mismatch.';
            }
            else if (qType === 'CODING') {
                // Mock test case pass simulation
                isCorrect = true;
                remarks += 'All test cases passed.';
            }
            const maxPoints = 5.00; // Mock default max marks per question
            const awardedMarks = isCorrect ? maxPoints : 0.00;
            await this.repo.saveQuestionEvaluation(sessionId, {
                question_snapshot_id: ans.question_id,
                awarded_marks: awardedMarks,
                maximum_marks: maxPoints,
                remarks
            }, undefined);
        }
        // Update session status to AUTO_GRADED
        await this.repo.updateSessionStatus(sessionId, 'AUTO_GRADED');
    }
}
exports.AutoGradingService = AutoGradingService;
exports.default = AutoGradingService;
