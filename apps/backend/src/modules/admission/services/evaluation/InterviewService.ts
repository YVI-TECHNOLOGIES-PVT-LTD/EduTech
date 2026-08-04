import { InterviewRepository } from '../../repositories/evaluation/InterviewRepository';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { Interview } from '../../domain/evaluation/Interview';
import { InterviewValidator } from './validators/InterviewValidator';
import { AuditService } from '../AuditService';
import {
    ApplicationWorkflowOrchestrator,
    type WorkflowEventContext,
} from '../application/ApplicationWorkflowOrchestrator';

export class InterviewService {
    constructor(
        private readonly interviewRepo: InterviewRepository,
        private readonly appRepo: ApplicationRepository,
        private readonly interviewValidator: InterviewValidator,
        private readonly auditService: AuditService,
        private readonly workflowOrchestrator?: ApplicationWorkflowOrchestrator
    ) {}

    public async scheduleInterview(
        applicationId: string,
        panelId: string,
        interviewDate: Date,
        roomName: string,
        createdBy: string | null,
        correlationId?: string
    ): Promise<Interview> {
        // Assert candidate passed baseline and exam eligibility checks
        await this.interviewValidator.validate(applicationId);

        const panel = await this.interviewRepo.findPanelById(panelId);
        if (!panel) {
            throw new Error(`Interview Panel with ID ${panelId} not found`);
        }

        const interview = new Interview(
            crypto.randomUUID(),
            applicationId,
            panelId,
            interviewDate,
            roomName,
            'SCHEDULED',
            null,
            new Date(),
            new Date()
        );

        await this.interviewRepo.save(interview);

        // Timeline log
        await this.appRepo.logWorkflow(
            applicationId,
            'INTERVIEW_SCHEDULED',
            null,
            'SUBMITTED',
            createdBy,
            `Interview panel [${panel.panel_name}] scheduled in room ${roomName} on ${interviewDate.toLocaleDateString()}.`
        );

        // Audit Trail log
        await this.auditService.logAudit({
            action: 'INTERVIEW_SCHEDULED',
            entityName: 'admission_interviews',
            entityId: interview.id,
            afterState: { panelId, roomName, date: interviewDate.toISOString() },
            userId: createdBy,
            correlationId
        });

        if (this.workflowOrchestrator) {
            const application = await this.appRepo.findById(applicationId);
            const ctx: WorkflowEventContext = {
                userId: createdBy,
                role: 'EXAM_CELL',
                correlationId,
                notes: `Interview scheduled in ${roomName}`,
                schoolId: application?.schoolId,
                academicYearId: application?.academicYearId,
            };
            await this.workflowOrchestrator.publish('INTERVIEW_CREATED', applicationId, ctx);
        }

        return interview;
    }
}
