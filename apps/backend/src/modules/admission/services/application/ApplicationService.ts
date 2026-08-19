import prisma from '../../../../lib/prismaClient';
import { BaseService } from '../BaseService';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { ApplicationValidationService } from './ApplicationValidationService';
import { ApplicationWorkflowService } from './ApplicationWorkflowService';
import {
  AdmissionApplication,
  type ApplicationStatus,
} from '../../domain/application/AdmissionApplication';
import { ApplicationDeclaration } from '../../domain/application/ApplicationDeclaration';
import {
  createApplicationSchema,
  submitApplicationSchema,
} from '../../dto/application/ApplicationDTO';
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
    private readonly workflowOrchestrator?: ApplicationWorkflowOrchestrator,
  ) {
    super();
  }

  /**
   * Initializes a new application draft or retrieves an existing one.
   */
  public async createApplication(
    schoolId: string,
    academicYearId: string,
    createdBy: string | null,
    payload: any,
    correlationId?: string,
  ): Promise<AdmissionApplication> {
    const validated = this.validate(createApplicationSchema, payload);

    let targetOrgId = schoolId;
    if (!targetOrgId || targetOrgId === 'school-main' || targetOrgId === 'org-main') {
      const activeOrg =
        (await prisma.organizations.findFirst({ where: { status: 'active' } })) ||
        (await prisma.organizations.findFirst());
      if (activeOrg) targetOrgId = activeOrg.org_id;
    }

    let targetAyId = academicYearId;
    if (!targetAyId || targetAyId === 'ay-2026') {
      const activeAy =
        (await prisma.academic_years.findFirst({ where: { org_id: targetOrgId } })) ||
        (await prisma.academic_years.findFirst());
      if (activeAy) targetAyId = activeAy.academic_year_id;
    }

    // Validate Admission Configuration
    const config =
      (await prisma.admission_configurations.findFirst({
        where: { org_id: targetOrgId, academic_year_id: targetAyId },
      })) ||
      (await prisma.admission_configurations.findFirst({
        where: { org_id: targetOrgId },
      }));

    if (config) {
      if (config.allow_online_application === false) {
        throw new ValidationError(
          'Online applications are currently disabled for this institution',
        );
      }
      const today = new Date();
      if (config.admission_start_date && today < new Date(config.admission_start_date)) {
        throw new ValidationError('Admission window is not yet open');
      }
      if (config.admission_end_date && today > new Date(config.admission_end_date)) {
        throw new ValidationError('Admission window for this academic year has closed');
      }
    }

    // Resolve Parent record
    const parentRec = createdBy
      ? await prisma.parents.findFirst({
          where: { user_id: createdBy },
        })
      : null;

    // Resolve or reuse existing Lead record (Parent + Child matching)
    let leadId = payload.lead_id || validated.lead_id;
    let lead: any = null;

    if (leadId) {
      lead = await prisma.leads.findUnique({ where: { lead_id: leadId } });
    }

    const inputFirstName = (payload.student_first_name || payload.student_name || '')
      .trim()
      .toLowerCase();

    if (!lead && !payload.is_new_child) {
      const orConditions: any[] = [];
      if (parentRec?.parent_id) {
        orConditions.push({ parent_id: parentRec.parent_id });
      }
      if (createdBy) {
        orConditions.push({ created_by: createdBy });
      }
      if (payload.parent_email) {
        orConditions.push({ contact_email: payload.parent_email });
      }

      if (orConditions.length > 0) {
        const candidates = await prisma.leads.findMany({
          where: { org_id: targetOrgId, OR: orConditions },
          include: {
            admissions_applications: {
              select: { application_id: true, status: true },
            },
          },
          orderBy: { created_at: 'asc' },
        });

        if (candidates.length > 0) {
          if (inputFirstName) {
            // First check if an existing lead belongs specifically to this child
            const matchedChild = candidates.find((c) => {
              const fn = (c.student_first_name || '').trim().toLowerCase();
              return (
                fn === inputFirstName &&
                !['applicant', 'student', ''].includes(fn) &&
                !fn.endsWith("'s ward")
              );
            });

            if (matchedChild) {
              lead = matchedChild;
            } else if (parentRec?.parent_id) {
              // If no child match, check for an unassigned/registration-created Lead under this parent
              const unassignedLead = candidates.find((c) => {
                const fn = (c.student_first_name || '').trim().toLowerCase();
                const isPlaceholder =
                  ['applicant', 'student', ''].includes(fn) || fn.endsWith("'s ward");
                const hasNoActiveApps =
                  !c.admissions_applications ||
                  c.admissions_applications.length === 0 ||
                  c.admissions_applications.every(
                    (a: any) => a.status === 'draft' || a.status === 'withdrawn',
                  );
                return c.parent_id === parentRec.parent_id && isPlaceholder && hasNoActiveApps;
              });
              if (unassignedLead) {
                lead = unassignedLead;
              }
            }
          } else {
            // Match latest lead only if it has an active DRAFT application
            const candidate = candidates[0];
            const draftApp = candidate.admissions_applications?.find(
              (a: any) => a.status === 'draft',
            );
            if (draftApp) {
              lead = candidate;
            }
          }
        }
      }
    }

    const dob =
      payload.date_of_birth && !isNaN(new Date(payload.date_of_birth).getTime())
        ? new Date(payload.date_of_birth)
        : undefined;

    if (lead) {
      leadId = lead.lead_id;
      // Update existing lead with latest student/contact fields
      const updateData: any = {
        student_first_name:
          payload.student_first_name || payload.student_name || lead.student_first_name,
        student_last_name: payload.student_last_name || lead.student_last_name || undefined,
        dob: dob || lead.dob,
        contact_name: payload.parent_name || lead.contact_name,
        contact_phone: payload.parent_phone || lead.contact_phone,
        contact_email: payload.parent_email || lead.contact_email,
      };
      if (payload.gender) {
        updateData.gender = payload.gender.toLowerCase() as any;
      }
      if (parentRec?.parent_id) {
        updateData.parent_id = parentRec.parent_id;
      }

      await prisma.leads.update({
        where: { lead_id: leadId },
        data: updateData,
      });
    } else {
      const year = new Date().getFullYear();
      const leadCount = await prisma.leads.count();
      const leadNumber = `LEAD-${year}-${String(leadCount + 1).padStart(5, '0')}`;
      const ayg =
        (await prisma.academic_year_grades.findFirst({
          where: { academic_year_id: targetAyId },
        })) ||
        (await prisma.academic_year_grades.findFirst({
          where: { is_active: true },
        })) ||
        (await prisma.academic_year_grades.findFirst());

      const targetAygId = payload.academic_year_grade_id || ayg?.academic_year_grade_id;

      const createData: any = {
        org_id: targetOrgId,
        lead_number: leadNumber,
        academic_year_grade_id: targetAygId!,
        student_first_name: payload.student_first_name || payload.student_name || 'Applicant',
        student_last_name: payload.student_last_name || undefined,
        dob: dob,
        gender: payload.gender ? (payload.gender.toLowerCase() as any) : undefined,
        contact_name: payload.parent_name || 'Parent User',
        contact_phone: payload.parent_phone || '0000000000',
        contact_email: payload.parent_email || 'parent@example.com',
        source: 'website' as any,
        stage: 'application_submitted' as any,
        created_by: createdBy || undefined,
      };
      if (parentRec?.parent_id) {
        createData.parent_id = parentRec.parent_id;
      }

      const newLead = await prisma.leads.create({
        data: createData,
      });
      leadId = newLead.lead_id;
    }

    // Check duplicate application prevention
    const existingApp = await prisma.admissions_applications.findFirst({
      where: { lead_id: leadId },
    });

    if (existingApp) {
      const app = new AdmissionApplication(
        existingApp.application_id,
        existingApp.org_id,
        existingApp.academic_year_id,
        existingApp.lead_id,
        (existingApp.status || 'SUBMITTED').toUpperCase() as ApplicationStatus,
        1,
        true,
        existingApp.created_by,
        'Existing application retrieved',
        null,
        new Date(existingApp.created_at),
        new Date(existingApp.updated_at),
        null,
        existingApp.application_number,
      );
      app.applicationNumber = existingApp.application_number;
      return app;
    }

    // Generate Server Authoritative Application Record
    const id = crypto.randomUUID();
    const year = new Date().getFullYear();
    const appCount = await prisma.admissions_applications.count();
    const appNumber = `APP-${year}-${String(appCount + 1).padStart(5, '0')}`;

    const newAppRecord = await prisma.admissions_applications.create({
      data: {
        application_id: id,
        application_number: appNumber,
        org_id: targetOrgId,
        academic_year_id: targetAyId,
        lead_id: leadId,
        status: 'submitted',
        created_by: createdBy || undefined,
      },
    });

    const application = new AdmissionApplication(
      newAppRecord.application_id,
      newAppRecord.org_id,
      newAppRecord.academic_year_id,
      newAppRecord.lead_id,
      'SUBMITTED',
      1,
      true,
      newAppRecord.created_by,
      'Application submitted successfully',
      null,
      new Date(newAppRecord.created_at),
      new Date(newAppRecord.updated_at),
      null,
      newAppRecord.application_number,
    );
    application.applicationNumber = newAppRecord.application_number;

    // Log Timeline
    await this.appRepo.logWorkflow(
      id,
      'INITIALIZE_DRAFT',
      null,
      'SUBMITTED',
      createdBy,
      'Initial application submitted',
    );

    // Audit Trail
    await this.auditService.logAudit({
      action: 'APPLICATION_CREATED',
      entityName: 'admission_applications',
      entityId: id,
      afterState: {
        schoolId: targetOrgId,
        academicYearId: targetAyId,
        grade: validated.grade,
        leadId,
      },
      userId: createdBy,
      correlationId,
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
    correlationId?: string,
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
      correlationId,
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
    return events.map((e) => ({
      action: e.action,
      fromStatus: e.from_status,
      toStatus: e.to_status,
      performedBy: e.performed_by,
      notes: e.notes,
      timestamp: e.created_at,
    }));
  }

  public async listForParent(userId: string, userEmail: string): Promise<AdmissionApplication[]> {
    return this.appRepo.findByParentUser(userId, userEmail);
  }

  public async assertParentCanAccess(
    applicationId: string,
    userId: string,
    userEmail: string,
  ): Promise<void> {
    const allowed = await this.appRepo.isOwnedByParent(applicationId, userId, userEmail);
    if (!allowed) {
      throw new BusinessRuleError('You do not have access to this application.');
    }
  }

  public async listForStaff(
    schoolId: string,
    filters: { status?: string; search?: string; page?: number; limit?: number },
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

  public async getStats(
    schoolId?: string,
  ): Promise<Array<{ id: string; status: string; created_at: string; updated_at: string }>> {
    return this.appRepo.findAllForStats(schoolId);
  }

  public async rejectApplication(
    applicationId: string,
    performedBy: string | null,
    reason: string,
    role: string,
    correlationId?: string,
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
    await this.appRepo.logWorkflow(
      applicationId,
      'APPLICATION_REJECTED',
      oldStatus,
      'REJECTED',
      performedBy,
      reason,
    );

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
    correlationId?: string,
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
