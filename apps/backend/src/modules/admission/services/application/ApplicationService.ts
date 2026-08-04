import { BaseService } from '../BaseService';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { ApplicationValidationService } from './ApplicationValidationService';
import { ApplicationWorkflowService } from './ApplicationWorkflowService';
import { AdmissionApplication, type ApplicationStatus } from '../../domain/application/AdmissionApplication';
import { ApplicationProfile } from '../../domain/application/ApplicationProfile';
import { ApplicationDeclaration } from '../../domain/application/ApplicationDeclaration';
import { createApplicationSchema, submitApplicationSchema } from '../../dto/application/ApplicationDTO';
import { NotFoundError } from '../../errors/NotFoundError';
import { ValidationError } from '../../errors/ValidationError';
import { BusinessRuleError } from '../../errors/BusinessRuleError';
import { AuditService } from '../AuditService';

import { ApplicationWorkflowOrchestrator } from './ApplicationWorkflowOrchestrator';

const LEGACY_STATUS_MAP: Record<string, string> = {
    draft: 'DRAFT',
    submitted: 'SUBMITTED',
    under_review: 'UNDER_REVIEW',
    docs_pending: 'DOCS_PENDING',
    docs_verified: 'DOCUMENT_VERIFIED',
    document_verified: 'DOCUMENT_VERIFIED',
    interview: 'INTERVIEW',
    exam: 'EXAM',
    merit: 'MERIT',
    offered: 'OFFERED',
    payment_pending: 'FEE_PENDING',
    fee_pending: 'FEE_PENDING',
    payment_verified: 'FEE_VERIFIED',
    fee_verified: 'FEE_VERIFIED',
    approved: 'OFFERED',
    enrolled: 'ENROLLED',
    rejected: 'REJECTED',
};

export class ApplicationService extends BaseService {
    constructor(
        private readonly appRepo: ApplicationRepository,
        private readonly valService: ApplicationValidationService,
        private readonly workflowService: ApplicationWorkflowService,
        private readonly auditService: AuditService,
        private readonly workflowOrchestrator?: ApplicationWorkflowOrchestrator
    ) {
        super();
    }

    /**
     * Registers a new Admission Application.
     */
    public async createApplication(
        schoolId: string,
        academicYearId: string,
        createdBy: string | null,
        payload: any,
        correlationId?: string
    ): Promise<AdmissionApplication> {
        const validated = this.validate(createApplicationSchema, payload);

        // Pre-validate creation criteria
        const dob = new Date(payload.date_of_birth);
        const name = payload.student_name;
        if (!payload.date_of_birth || !payload.student_name) {
            throw new ValidationError('Student Name and Date of Birth are required to validate application creation');
        }

        await this.valService.validateCreation(
            validated.lead_id,
            name,
            dob,
            schoolId,
            academicYearId,
            validated.grade
        );

        const id = crypto.randomUUID();
        const application = new AdmissionApplication(
            id,
            schoolId,
            academicYearId,
            validated.lead_id,
            'DRAFT',
            1,
            true,
            createdBy,
            'Application initialized as draft',
            null,
            new Date(),
            new Date()
        );

        await this.appRepo.save(application);

        // Initialize empty profile
        const profile = new ApplicationProfile(
            crypto.randomUUID(),
            id,
            dob,
            payload.gender || 'Other',
            payload.blood_group || null,
            payload.nationality || null,
            payload.religion || null,
            payload.category || null,
            payload.aadhaar || null,
            null, // photo_url placeholder
            null,
            null,
            null,
            new Date(),
            new Date()
        );
        await this.appRepo.saveProfile(profile);

        // Log Timeline
        await this.appRepo.logWorkflow(id, 'INITIALIZE_DRAFT', null, 'DRAFT', createdBy, 'Initial draft created');

        // Audit Trail
        await this.auditService.logAudit({
            action: 'APPLICATION_CREATED',
            entityName: 'admission_applications',
            entityId: id,
            afterState: { schoolId, academicYearId, grade: validated.grade, leadId: validated.lead_id },
            userId: createdBy,
            correlationId
        });

        return application;
    }

    /**
     * Submits an application draft for review.
     */
    public async submitApplication(
        id: string,
        payload: any,
        role: string,
        performedBy: string | null,
        correlationId?: string
    ): Promise<AdmissionApplication> {
        const application = await this.appRepo.findById(id);
        if (!application) {
            throw new NotFoundError(`Application with ID ${id} not found`);
        }

        if (application.status === 'SUBMITTED') {
            throw new BusinessRuleError('Application is already submitted and locked');
        }

        // Validate payload matches all required submit fields
        const validated = this.validate(submitApplicationSchema, payload);

        // Transition status to SUBMITTED via state machine
        const updated = await this.workflowService.transitionTo(
            id,
            'SUBMITTED',
            role,
            performedBy,
            validated.change_reason || 'Application submitted successfully',
            correlationId
        );

        return updated;
    }

    /**
     * Formats application timeline states log details.
     */
    public async getTimeline(id: string): Promise<any[]> {
        const application = await this.appRepo.findById(id);
        if (!application) {
            throw new NotFoundError(`Application with ID ${id} not found`);
        }

        const events = await this.appRepo.findTimeline(id);
        return events.map(e => ({
            action: e.action,
            fromStatus: e.from_status,
            toStatus: e.to_status,
            performedBy: e.performed_by,
            notes: e.notes,
            timestamp: e.created_at
        }));
    }

    public async listForParent(userId: string, userEmail: string): Promise<AdmissionApplication[]> {
        return this.appRepo.findByParentUser(userId, userEmail);
    }

    public async assertParentCanAccess(applicationId: string, userId: string, userEmail: string): Promise<void> {
        const allowed = await this.appRepo.isOwnedByParent(applicationId, userId, userEmail);
        if (!allowed) {
            throw new BusinessRuleError('You do not have access to this application.');
        }
    }

    public async listForStaff(
        schoolId: string,
        filters: { status?: string; search?: string; page?: number; limit?: number }
    ): Promise<{ data: any[]; total: number }> {
        const crmStatus = filters.status
            ? (LEGACY_STATUS_MAP[filters.status.toLowerCase()] ?? filters.status.toUpperCase())
            : undefined;
        return this.appRepo.findAllPaginated({
            schoolId,
            status: crmStatus,
            search: filters.search,
            page: filters.page,
            limit: filters.limit,
        });
    }

    public async getStats(schoolId?: string): Promise<Array<{ id: string; status: string; created_at: string; updated_at: string }>> {
        return this.appRepo.findAllForStats(schoolId);
    }

    public async rejectApplication(
        applicationId: string,
        performedBy: string | null,
        reason: string,
        role: string,
        correlationId?: string
    ): Promise<AdmissionApplication> {
        const application = await this.appRepo.findById(applicationId);
        if (!application) {
            throw new NotFoundError(`Application with ID ${applicationId} not found`);
        }
        if (application.status === 'ENROLLED') {
            throw new BusinessRuleError('Cannot reject an enrolled application.');
        }

        const oldStatus = application.status;
        application.updateStatus('REJECTED' as ApplicationStatus, reason);
        await this.appRepo.save(application);
        await this.appRepo.logWorkflow(applicationId, 'APPLICATION_REJECTED', oldStatus, 'REJECTED', performedBy, reason);

        await this.auditService.logAudit({
            action: 'APPLICATION_REJECTED',
            entityName: 'admission_applications',
            entityId: applicationId,
            afterState: { status: 'REJECTED', reason },
            userId: performedBy,
            correlationId,
        });

        return application;
    }

    public async verifyDocuments(
        applicationId: string,
        performedBy: string | null,
        remark: string,
        role: string,
        correlationId?: string
    ): Promise<AdmissionApplication | null> {
        if (!this.workflowOrchestrator) {
            throw new BusinessRuleError('Workflow orchestrator not configured');
        }
        return this.workflowOrchestrator.publish('DOCUMENT_VERIFIED', applicationId, {
            userId: performedBy,
            role,
            correlationId,
            notes: remark,
        });
    }
}
