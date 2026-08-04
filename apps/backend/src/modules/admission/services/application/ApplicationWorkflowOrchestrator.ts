import { BaseService } from '../BaseService';
import { ApplicationWorkflowService } from './ApplicationWorkflowService';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { DocumentRepository } from '../../repositories/application/DocumentRepository';
import { DocumentChecklistRepository } from '../../repositories/application/DocumentChecklistRepository';
import { DocumentTypeRepository } from '../../repositories/application/DocumentTypeRepository';
import { InterviewRepository } from '../../repositories/evaluation/InterviewRepository';
import { ExamRepository } from '../../repositories/evaluation/ExamRepository';
import { FeeRepository } from '../../repositories/enrollment/FeeRepository';
import { PaymentRepository } from '../../repositories/enrollment/PaymentRepository';
import { AdmissionApplication } from '../../domain/application/AdmissionApplication';
import { AuditService } from '../AuditService';

export const WORKFLOW_ORCHESTRATOR_ROLE = 'WORKFLOW_ORCHESTRATOR';

export type WorkflowEvent =
    | 'APPLICATION_CREATED'
    | 'DOCUMENT_UPLOADED'
    | 'DOCUMENT_VERIFIED'
    | 'DOCUMENT_REJECTED'
    | 'INTERVIEW_CREATED'
    | 'INTERVIEW_UPDATED'
    | 'INTERVIEW_COMPLETED'
    | 'EXAM_COMPLETED'
    | 'FEE_PAID'
    | 'APPLICATION_REVIEWED'
    | 'APPLICATION_APPROVED'
    | 'ERP_STUDENT_CREATED';

export interface WorkflowEventContext {
    userId: string | null;
    role: string;
    correlationId?: string;
    notes?: string;
    ipAddress?: string;
    browser?: string;
    schoolId?: string;
    academicYearId?: string;
}

const EVENT_TARGET_STATUS: Record<WorkflowEvent, string> = {
    APPLICATION_CREATED: 'DRAFT',
    DOCUMENT_UPLOADED: 'DOCS_PENDING',
    DOCUMENT_VERIFIED: 'DOCUMENT_VERIFIED',
    DOCUMENT_REJECTED: 'DOCS_PENDING',
    INTERVIEW_CREATED: 'INTERVIEW',
    INTERVIEW_UPDATED: 'INTERVIEW',
    INTERVIEW_COMPLETED: 'EXAM',
    EXAM_COMPLETED: 'FEE_PENDING',
    FEE_PAID: 'FEE_VERIFIED',
    APPLICATION_REVIEWED: 'FEE_VERIFIED',
    APPLICATION_APPROVED: 'OFFERED',
    ERP_STUDENT_CREATED: 'ENROLLED',
};

const STATUS_RANK: Record<string, number> = {
    DRAFT: 0,
    IN_PROGRESS: 1,
    CORRECTION_REQUIRED: 1,
    SUBMITTED: 2,
    UNDER_REVIEW: 3,
    DOCS_PENDING: 4,
    DOCUMENT_VERIFIED: 5,
    INTERVIEW: 6,
    EXAM: 7,
    MERIT: 8,
    OFFERED: 9,
    FEE_PENDING: 10,
    FEE_VERIFIED: 11,
    ENROLLED: 12,
};

const REGRESSIVE_EVENTS: WorkflowEvent[] = ['DOCUMENT_REJECTED'];

export class ApplicationWorkflowOrchestrator extends BaseService {
    constructor(
        private readonly workflowService: ApplicationWorkflowService,
        private readonly appRepo: ApplicationRepository,
        private readonly docRepo: DocumentRepository,
        private readonly checklistRepo: DocumentChecklistRepository,
        private readonly docTypeRepo: DocumentTypeRepository,
        private readonly interviewRepo: InterviewRepository,
        private readonly examRepo: ExamRepository,
        private readonly feeRepo: FeeRepository,
        private readonly paymentRepo: PaymentRepository,
        private readonly auditService: AuditService
    ) {
        super();
    }

    /**
     * Publishes a domain workflow event and advances application status idempotently.
     * All modules must call this instead of updating application.status directly.
     */
    public async publish(
        event: WorkflowEvent,
        applicationId: string,
        context: WorkflowEventContext
    ): Promise<AdmissionApplication | null> {
        const application = await this.appRepo.findById(applicationId);
        if (!application) {
            return null;
        }

        let targetStatus = EVENT_TARGET_STATUS[event];
        if (event === 'APPLICATION_REVIEWED') {
            // APPLICATION_REVIEWED from early-stage statuses should advance to UNDER_REVIEW
            // not the default FEE_VERIFIED target which would skip intermediate steps
            const currentLower = application.status.toLowerCase().trim();
            const earlyStages = ['draft', 'submitted', 'in_progress', 'correction_required'];
            if (earlyStages.includes(currentLower)) {
                targetStatus = 'UNDER_REVIEW';
            }
        }
        const currentStatus = application.status.toUpperCase().trim();
        const currentRank = STATUS_RANK[currentStatus] ?? 0;
        const targetRank = STATUS_RANK[targetStatus] ?? 0;

        if (currentStatus === targetStatus) {
            return application;
        }

        const isRegressive = REGRESSIVE_EVENTS.includes(event);
        if (!isRegressive && targetRank < currentRank) {
            return application;
        }

        const canAdvance = await this.validateEventPreconditions(event, applicationId, application, context);
        if (!canAdvance) {
            return application;
        }

        const notes =
            context.notes ??
            `Workflow event ${event} advanced status to ${targetStatus}`;

        const updated = await this.workflowService.transitionTo(
            applicationId,
            targetStatus,
            WORKFLOW_ORCHESTRATOR_ROLE,
            context.userId,
            notes,
            context.correlationId
        );

        await this.auditService.logAudit({
            action: `WORKFLOW_${event}`,
            entityName: 'admission_applications',
            entityId: applicationId,
            beforeState: { status: currentStatus },
            afterState: {
                status: targetStatus,
                event,
                role: context.role,
                schoolId: context.schoolId ?? application.schoolId,
                academicYearId: context.academicYearId ?? application.academicYearId,
            },
            userId: context.userId,
            correlationId: context.correlationId,
            ipAddress: context.ipAddress,
            userAgent: context.browser,
        });

        await this.appRepo.logWorkflow(
            applicationId,
            event,
            currentStatus,
            targetStatus,
            context.userId,
            notes
        );

        return updated;
    }

    private async validateEventPreconditions(
        event: WorkflowEvent,
        applicationId: string,
        application: AdmissionApplication,
        context?: WorkflowEventContext
    ): Promise<boolean> {
        switch (event) {
            case 'DOCUMENT_VERIFIED': {
                // If manual verification is performed by an ADMISSION_OFFICER or ADMIN, bypass automated verification checks
                const role = context?.role?.toUpperCase().trim();
                if (role === 'ADMISSION_OFFICER' || role === 'ADMIN') {
                    return true;
                }
                return this.areMandatoryDocumentsVerified(applicationId, application);
            }
            case 'INTERVIEW_COMPLETED': {
                const interview = await this.interviewRepo.findByApplicationId(applicationId).catch(() => null);
                return interview?.status === 'EVALUATED';
            }
            case 'EXAM_COMPLETED':
                return this.isExamFullyEvaluated(applicationId);
            case 'FEE_PAID':
                return this.areFeesFullyPaid(applicationId);
            case 'ERP_STUDENT_CREATED':
                return application.status === 'FEE_VERIFIED' || application.status === 'OFFERED';
            default:
                return true;
        }
    }

    private async areMandatoryDocumentsVerified(
        applicationId: string,
        application: AdmissionApplication
    ): Promise<boolean> {
        const grade = await this.appRepo.getGradeForApplication(applicationId);
        const checklistRules = await this.checklistRepo.findByGrade(
            application.schoolId,
            application.academicYearId,
            grade
        );

        const uploadedDocs = await this.docRepo.findByApplicationId(applicationId);
        const docsByTypeId = new Map(uploadedDocs.map(d => [d.documentTypeId, d]));

        if (checklistRules.length === 0) {
            const mandatoryTypes = await this.docTypeRepo.findActiveMandatory();
            if (mandatoryTypes.length === 0) {
                return uploadedDocs.some(d => d.status === 'VERIFIED');
            }
            return mandatoryTypes.every(type => {
                const doc = docsByTypeId.get(type.id);
                return doc?.status === 'VERIFIED';
            });
        }

        const mandatoryRules = checklistRules.filter(r => r.mandatory);
        if (mandatoryRules.length === 0) {
            return true;
        }

        return mandatoryRules.every(rule => {
            const doc = docsByTypeId.get(rule.documentTypeId);
            return doc?.status === 'VERIFIED';
        });
    }

    private async isExamFullyEvaluated(applicationId: string): Promise<boolean> {
        const candidate = await this.examRepo.findCandidateByApplicationId(applicationId).catch(() => null);
        if (!candidate) {
            return false;
        }

        const schedule = await this.examRepo.findScheduleById(candidate.session_id);
        if (!schedule) {
            return false;
        }

        const subjects = await this.examRepo.findSubjectsByTemplateId(schedule.templateId);
        const results = await this.examRepo.findResultsByCandidateId(candidate.id);
        if (subjects.length === 0) {
            return !!candidate;
        }
        return results.length >= subjects.length;
    }

    private async areFeesFullyPaid(applicationId: string): Promise<boolean> {
        const assignments = await this.feeRepo.findAssignmentsByApplicationId(applicationId).catch(() => []);
        if (assignments.length === 0) {
            const payments = await this.paymentRepo.findPaymentsByApplicationId(applicationId).catch(() => []);
            return payments.some((p: { status?: string }) => p.status === 'COMPLETED');
        }
        return assignments.every(a => a.outstandingAmount <= 0);
    }
}
