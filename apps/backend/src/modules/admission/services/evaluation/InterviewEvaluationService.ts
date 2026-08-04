import { InterviewRepository } from '../../repositories/evaluation/InterviewRepository';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { InterviewScore } from '../../domain/evaluation/InterviewScore';
import { AuditService } from '../AuditService';
import { InterviewStateMachine } from './state-machine/InterviewStateMachine';
import {
    ApplicationWorkflowOrchestrator,
    type WorkflowEventContext,
} from '../application/ApplicationWorkflowOrchestrator';

export class InterviewEvaluationService {
    constructor(
        private readonly interviewRepo: InterviewRepository,
        private readonly appRepo: ApplicationRepository,
        private readonly stateMachine: InterviewStateMachine,
        private readonly auditService: AuditService,
        private readonly workflowOrchestrator?: ApplicationWorkflowOrchestrator
    ) {}

    public async recordScores(
        interviewId: string,
        scores: Array<{ criterion_id: string; score: number; remarks?: string }>,
        reviewerId: string | null,
        role: string,
        correlationId?: string
    ): Promise<void> {
        const interview = await this.interviewRepo.findById(interviewId);
        if (!interview) {
            throw new Error(`Interview with ID ${interviewId} not found`);
        }

        // Validate transitions constraint rules (SCHEDULED → COMPLETED → EVALUATED)
        const oldStatus = interview.status;
        const normalizedRole = role.toUpperCase() === 'EXAM_CELL_ADMIN' ? 'EXAM_CELL' : role;

        if (oldStatus === 'SCHEDULED') {
            await this.stateMachine.validateTransition(oldStatus, 'COMPLETED', normalizedRole);
            interview.transition('COMPLETED', 'Interview conducted.');
            await this.interviewRepo.save(interview);
        }

        await this.stateMachine.validateTransition(interview.status, 'EVALUATED', normalizedRole);

        // Fetch criteria list
        const activeCriteria = await this.interviewRepo.findCriteria();

        // Record criteria scores
        for (const inputScore of scores) {
            const criterion = activeCriteria.find(c => c.id === inputScore.criterion_id);
            if (!criterion) {
                throw new Error(`Active Interview Criterion with ID ${inputScore.criterion_id} not found`);
            }

            const item = new InterviewScore(
                crypto.randomUUID(),
                interviewId,
                inputScore.criterion_id,
                inputScore.score,
                inputScore.remarks || null,
                new Date()
            );
            await this.interviewRepo.saveScore(item);
        }

        // Transition status to EVALUATED
        interview.transition('EVALUATED', 'Interview evaluation scores submitted.');
        await this.interviewRepo.save(interview);

        // Timeline log
        await this.appRepo.logWorkflow(
            interview.applicationId,
            'INTERVIEW_COMPLETED',
            null,
            'SUBMITTED',
            reviewerId,
            `Interview evaluation completed. Candidate review grading generated.`
        );

        // Audit Trail log
        await this.auditService.logAudit({
            action: 'INTERVIEW_EVALUATION_COMPLETED',
            entityName: 'admission_interviews',
            entityId: interviewId,
            afterState: { scoresCount: scores.length },
            userId: reviewerId,
            correlationId
        });

        if (this.workflowOrchestrator) {
            const application = await this.appRepo.findById(interview.applicationId);
            const ctx: WorkflowEventContext = {
                userId: reviewerId,
                role,
                correlationId,
                notes: 'Interview evaluation completed',
                schoolId: application?.schoolId,
                academicYearId: application?.academicYearId,
            };
            await this.workflowOrchestrator.publish('INTERVIEW_COMPLETED', interview.applicationId, ctx);
        }
    }
}
