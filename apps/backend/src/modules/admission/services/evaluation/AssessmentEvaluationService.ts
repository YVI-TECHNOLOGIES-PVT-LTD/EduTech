import { ExamRepository } from '../../repositories/evaluation/ExamRepository';
import { BaseService } from '../BaseService';
import { supabase } from '../../../../config/supabase';

// Strategy Pattern for Question Evaluators
interface IEvaluatorStrategy {
    evaluate(response: any, question: any, options: any[]): { isCorrect: boolean; marksAwarded: number };
}

class MCQEvaluator implements IEvaluatorStrategy {
    evaluate(response: any, question: any, options: any[]): { isCorrect: boolean; marksAwarded: number } {
        const selectedOption = options.find(opt => opt.id === response.selected_option_id);
        const isCorrect = selectedOption ? !!selectedOption.is_correct : false;
        const marksAwarded = isCorrect ? Number(question.points) : -Number(question.negative_marks || 0);
        return { isCorrect, marksAwarded };
    }
}

class TrueFalseEvaluator implements IEvaluatorStrategy {
    evaluate(response: any, question: any, options: any[]): { isCorrect: boolean; marksAwarded: number } {
        const selectedOption = options.find(opt => opt.id === response.selected_option_id);
        const isCorrect = selectedOption ? !!selectedOption.is_correct : false;
        const marksAwarded = isCorrect ? Number(question.points) : -Number(question.negative_marks || 0);
        return { isCorrect, marksAwarded };
    }
}

class MultipleSelectEvaluator implements IEvaluatorStrategy {
    evaluate(response: any, question: any, options: any[]): { isCorrect: boolean; marksAwarded: number } {
        // Multi-select evaluates matching intersection.
        // For simplicity: check if correct options match response selection.
        const correctOptionIds = options.filter(o => o.is_correct).map(o => o.id);
        const selectedId = response.selected_option_id;
        const isCorrect = correctOptionIds.includes(selectedId);
        const marksAwarded = isCorrect ? Number(question.points) : -Number(question.negative_marks || 0);
        return { isCorrect, marksAwarded };
    }
}

export class AssessmentEvaluationService extends BaseService {
    private readonly evaluators: Record<string, IEvaluatorStrategy>;

    constructor(private readonly examRepo: ExamRepository) {
        super();
        this.evaluators = {
            'MCQ': new MCQEvaluator(),
            'TRUE_FALSE': new TrueFalseEvaluator(),
            'MULTIPLE_SELECT': new MultipleSelectEvaluator()
        };
    }

    public async evaluateAttempt(attemptId: string): Promise<void> {
        const attempt = await this.examRepo.findAttemptById(attemptId);
        if (!attempt) {
            throw new Error('Attempt not found.');
        }

        // Mark attempt submitted
        attempt.status = 'SUBMITTED';
        attempt.submit_time = new Date();
        await this.examRepo.saveAttempt(attempt);

        // Fetch snapshot questions and all options including correct flags
        const { data: snapshotQuestions, error: qErr } = await supabase
            .from('admission_assessment_snapshot_questions')
            .select('*')
            .eq('snapshot_id', attempt.snapshot_id);

        if (qErr) throw qErr;

        // Fetch candidate responses
        const { data: responses, error: rErr } = await supabase
            .from('admission_assessment_responses')
            .select('*')
            .eq('attempt_id', attemptId);

        if (rErr) throw rErr;

        let totalScore = 0;
        let requiresManualGrading = false;

        const responseMap = new Map(responses?.map(r => [r.snapshot_question_id, r]));

        for (const question of snapshotQuestions || []) {
            const response = responseMap.get(question.id);
            if (!response) continue;

            const qType = question.question_type;

            if (qType === 'SUBJECTIVE' || qType === 'AUDIO_RESPONSE' || qType === 'VIDEO_RESPONSE' || qType === 'FILE_UPLOAD') {
                requiresManualGrading = true;
                continue;
            }

            const strategy = this.evaluators[qType];
            if (strategy) {
                const { data: options } = await supabase
                    .from('admission_assessment_snapshot_question_options')
                    .select('*')
                    .eq('snapshot_question_id', question.id);

                const { isCorrect, marksAwarded } = strategy.evaluate(response, question, options || []);
                
                // Update response
                await supabase
                    .from('admission_assessment_responses')
                    .update({
                        is_correct: isCorrect,
                        marks_awarded: marksAwarded,
                        graded_at: new Date()
                    })
                    .eq('id', response.id);

                totalScore += marksAwarded;
            }
        }

        // Set aggregate score & pipeline status
        attempt.score_obtained = totalScore;
        attempt.evaluation_status = requiresManualGrading ? 'MANUAL_REVIEWED' : 'AUTO_EVALUATED';
        
        await this.examRepo.saveAttempt(attempt);

        // If auto-evaluated fully, auto-publish and write outbox transaction
        if (!requiresManualGrading) {
            attempt.evaluation_status = 'PUBLISHED';
            await this.examRepo.saveAttempt(attempt);

            // Fetch session
            const session = await this.examRepo.findSessionById(attempt.session_id);
            const candidate = await this.examRepo.findCandidateById(session.candidate_allocation_id);

            // Write transactional Outbox payload
            await this.examRepo.saveOutbox(attempt.school_id, 'ASSESSMENT_COMPLETED', {
                attempt_id: attempt.id,
                application_id: candidate.application_id,
                score_obtained: totalScore,
                evaluation_status: 'PUBLISHED'
            });
        }
    }
}
