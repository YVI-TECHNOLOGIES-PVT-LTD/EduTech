import prisma from '../../../lib/prismaClient';
import { application_status } from '@prisma/client';
import { AdmissionRepository } from '../repositories/admission.repository';
import { AdmissionSearchRepository } from '../repositories/admission.search.repository';
import { ApplicationValidator } from '../validators/application.validator';
import {
  ApplicationNotFoundError,
  DuplicateApplicationError,
  ApplicationValidationError,
  ApplicationForbiddenError,
} from '../errors/admission.errors';
import { CreateApplicationDto } from '../dto/request/create-application.dto';
import { UpdateApplicationDto } from '../dto/request/update-application.dto';
import { SearchApplicationDto } from '../dto/request/search-application.dto';
import { AdmissionMapper } from '../mappers/admission.mapper';
import {
  ApplicationResponseDto,
  PaginatedResponse,
} from '../dto/response/application.response.dto';
import { AdmissionEvents, ApplicationEventType } from '../events/admission.events';
import { StorageService } from '../../../services/storage.service';
import { logger } from '../../../utils/logger';

export class AdmissionService {
  static async createApplication(
    dto: CreateApplicationDto,
    performedBy?: string | null,
    userOrgId?: string,
  ): Promise<ApplicationResponseDto> {
    ApplicationValidator.validateCreate(dto);

    const isValidUuid = (id?: string | null) =>
      !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let targetLeadId: string | undefined = isValidUuid(dto.lead_id)
      ? (dto.lead_id as string)
      : undefined;
    let targetOrgId: string | undefined =
      (isValidUuid(dto.org_id) ? (dto.org_id as string) : undefined) ||
      (isValidUuid(dto.school_id) ? (dto.school_id as string) : undefined) ||
      (isValidUuid(userOrgId) ? (userOrgId as string) : undefined);

    if (!targetOrgId) {
      const activeOrg = await prisma.organizations.findFirst({ where: { status: 'active' } });
      targetOrgId = activeOrg?.org_id;
    }
    if (!targetOrgId) {
      throw new ApplicationValidationError('Organization ID is required');
    }

    let targetAcademicYearId: string | undefined = isValidUuid(dto.academic_year_id)
      ? (dto.academic_year_id as string)
      : undefined;
    if (!targetAcademicYearId) {
      const activeYear = await prisma.academic_years.findFirst({
        where: { org_id: targetOrgId },
        orderBy: { created_at: 'desc' },
      });
      targetAcademicYearId = activeYear?.academic_year_id;
    }
    if (!targetAcademicYearId) {
      throw new ApplicationValidationError('No active academic year found for organization');
    }

    const safeOrgId: string = targetOrgId;
    const safeAcademicYearId: string = targetAcademicYearId;

    let application: any;

    // 1. Resolve Parent Record if performedBy is present
    let parentRecord: any = null;
    if (performedBy) {
      parentRecord = await prisma.parents.findUnique({
        where: { user_id: performedBy },
      });

      if (!parentRecord) {
        const user = await prisma.users.findUnique({ where: { user_id: performedBy } });
        if (user) {
          let pFirst = dto.parent_first_name || '';
          let pLast = dto.parent_last_name || '';
          if (!pFirst && dto.parent_name) {
            const parts = dto.parent_name.trim().split(' ');
            pFirst = parts[0];
            pLast = parts.slice(1).join(' ');
          }

          const pEmail = user.email || dto.contact_email || dto.parent_email;
          const pPhone = user.phone || dto.contact_phone || dto.parent_phone || '9999999999';

          const existingUnlinkedParent = await prisma.parents.findFirst({
            where: {
              org_id: safeOrgId,
              OR: [...(pEmail ? [{ email: pEmail }] : []), ...(pPhone ? [{ phone: pPhone }] : [])],
            },
          });

          if (existingUnlinkedParent) {
            parentRecord = await prisma.parents.update({
              where: { parent_id: existingUnlinkedParent.parent_id },
              data: { user_id: performedBy },
            });
          } else {
            parentRecord = await prisma.parents.create({
              data: {
                org_id: safeOrgId,
                user_id: performedBy,
                first_name: pFirst || user.first_name || 'Parent',
                last_name: pLast || user.last_name || undefined,
                phone: pPhone,
                email: pEmail || undefined,
              },
            });
          }
        }
      }
    }

    // 2. Pre-transaction resolution for grade offering
    let aygId = dto.academic_year_grade_id;
    if (!aygId && dto.grade_id) {
      const ayg = await prisma.academic_year_grades.findFirst({
        where: { academic_year_id: safeAcademicYearId, grade_id: dto.grade_id },
        select: { academic_year_grade_id: true },
      });
      aygId = ayg?.academic_year_grade_id;
    }
    if (!aygId && dto.grade_applied_for) {
      const matchedGrade = await prisma.grades.findFirst({
        where: { org_id: safeOrgId, grade_name: dto.grade_applied_for },
        select: { grade_id: true },
      });
      if (matchedGrade) {
        const ayg = await prisma.academic_year_grades.findFirst({
          where: { academic_year_id: safeAcademicYearId, grade_id: matchedGrade.grade_id },
          select: { academic_year_grade_id: true },
        });
        aygId = ayg?.academic_year_grade_id;
      }
    }
    if (!aygId) {
      const ayg = await prisma.academic_year_grades.findFirst({
        where: { academic_year_id: safeAcademicYearId, is_active: true },
        select: { academic_year_grade_id: true },
      });
      aygId = ayg?.academic_year_grade_id;
    }
    if (!aygId) {
      throw new ApplicationValidationError('Grade offering not found for academic year');
    }

    // 3. Child identity extraction
    let sFirst = (dto.student_first_name || '').trim();
    let sLast = (dto.student_last_name || '').trim();
    if (!sFirst && dto.student_name) {
      const parts = dto.student_name.trim().split(' ');
      sFirst = parts[0];
      sLast = parts.slice(1).join(' ');
    }
    sFirst = sFirst.trim();
    sLast = sLast.trim();

    const parsedDob = dto.date_of_birth ? new Date(dto.date_of_birth) : undefined;
    const validDob = parsedDob && !isNaN(parsedDob.getTime()) ? parsedDob : undefined;

    let pFirst = dto.parent_first_name || '';
    let pLast = dto.parent_last_name || '';
    if (!pFirst && dto.parent_name) {
      const parts = dto.parent_name.trim().split(' ');
      pFirst = parts[0];
      pLast = parts.slice(1).join(' ');
    }
    const parentFullName = `${pFirst} ${pLast}`.trim() || 'Parent User';

    // 4. Atomic transaction for Lead Resolution + Application Creation
    application = await prisma.$transaction(
      async (tx) => {
        let resolvedLead: any = null;

        // Case A: Explicit targetLeadId supplied
        if (targetLeadId) {
          const lead = await tx.leads.findUnique({
            where: { lead_id: targetLeadId },
          });
          if (!lead) {
            throw new ApplicationValidationError(`Lead ${targetLeadId} not found`);
          }
          if (lead.org_id !== safeOrgId) {
            throw new ApplicationValidationError(
              'Unauthorized: Lead belongs to a different organization',
            );
          }
          if (performedBy && parentRecord) {
            const isOwner =
              lead.parent_id === parentRecord.parent_id || lead.created_by === performedBy;
            if (!isOwner) {
              throw new ApplicationValidationError(
                'Unauthorized: You do not own this child profile',
              );
            }
          }
          resolvedLead = lead;
        }

        // Case B: No targetLeadId, but parentRecord exists -> Deterministic child matching under Parent
        if (!resolvedLead && parentRecord && sFirst) {
          // B.1 Check for existing Lead explicitly matching this child
          const matchingChildLead = await tx.leads.findFirst({
            where: {
              org_id: safeOrgId,
              parent_id: parentRecord.parent_id,
              student_first_name: { equals: sFirst, mode: 'insensitive' },
              ...(sLast ? { student_last_name: { equals: sLast, mode: 'insensitive' } } : {}),
              ...(validDob ? { dob: validDob } : {}),
            },
            orderBy: { created_at: 'asc' },
          });

          if (matchingChildLead) {
            resolvedLead = matchingChildLead;
          } else if (!(dto as any).is_new_child) {
            // B.2 Check if parent has an unassigned / registration-created Lead to claim for this first child
            const parentLeads = await tx.leads.findMany({
              where: {
                org_id: safeOrgId,
                parent_id: parentRecord.parent_id,
              },
              include: {
                admissions_applications: {
                  select: { application_id: true, status: true },
                },
              },
              orderBy: { created_at: 'asc' },
            });

            const unassignedLead = parentLeads.find((l) => {
              const fn = (l.student_first_name || '').trim().toLowerCase();
              const isPlaceholder =
                ['applicant', 'student', ''].includes(fn) || fn.endsWith("'s ward");
              const hasNoActiveApps =
                !l.admissions_applications ||
                l.admissions_applications.length === 0 ||
                l.admissions_applications.every(
                  (a) => (a.status as string) === 'draft' || (a.status as string) === 'withdrawn',
                );
              return isPlaceholder && hasNoActiveApps;
            });

            if (unassignedLead) {
              // Update the registration lead with actual child details
              resolvedLead = await tx.leads.update({
                where: { lead_id: unassignedLead.lead_id },
                data: {
                  student_first_name: sFirst,
                  student_last_name: sLast || undefined,
                  dob: validDob || unassignedLead.dob,
                  gender: (dto.gender?.toLowerCase() as any) || unassignedLead.gender,
                  academic_year_grade_id: aygId || unassignedLead.academic_year_grade_id,
                  stage: 'application_submitted' as any,
                  updated_at: new Date(),
                  updated_by: performedBy || undefined,
                },
              });
            }
          }
        }

        // Case C: No targetLeadId, unlinked parent but performedBy user exists
        if (!resolvedLead && performedBy && sFirst) {
          resolvedLead = await tx.leads.findFirst({
            where: {
              org_id: safeOrgId,
              created_by: performedBy,
              student_first_name: { equals: sFirst, mode: 'insensitive' },
              ...(sLast ? { student_last_name: { equals: sLast, mode: 'insensitive' } } : {}),
              ...(validDob ? { dob: validDob } : {}),
            },
            orderBy: { created_at: 'asc' },
          });
        }

        // Case D: Public / Anonymous submission matching by contact phone + child name
        if (!resolvedLead && !performedBy && (dto.contact_phone || dto.parent_phone) && sFirst) {
          resolvedLead = await tx.leads.findFirst({
            where: {
              org_id: safeOrgId,
              contact_phone: dto.contact_phone || dto.parent_phone,
              student_first_name: { equals: sFirst, mode: 'insensitive' },
              ...(sLast ? { student_last_name: { equals: sLast, mode: 'insensitive' } } : {}),
              ...(validDob ? { dob: validDob } : {}),
            },
            orderBy: { created_at: 'asc' },
          });
        }

        // If lead was found: preserve lead identity and update stage to application_submitted
        if (resolvedLead) {
          if (resolvedLead.stage !== 'application_submitted' && resolvedLead.stage !== 'enrolled') {
            await tx.leads.update({
              where: { lead_id: resolvedLead.lead_id },
              data: {
                stage: 'application_submitted' as any,
                updated_at: new Date(),
                updated_by: performedBy || undefined,
              },
            });
          }
        } else {
          // If lead NOT found: create new Lead for this child under parent
          const year = new Date().getFullYear();
          const lastLead = await tx.leads.findFirst({
            where: { lead_number: { startsWith: `LEAD-${year}-` } },
            orderBy: { lead_number: 'desc' },
            select: { lead_number: true },
          });
          let nextLeadSeq = 1;
          if (lastLead?.lead_number) {
            const match = lastLead.lead_number.match(/(\d+)$/);
            if (match) nextLeadSeq = parseInt(match[1], 10) + 1;
          }
          const leadNumber = `LEAD-${year}-${String(nextLeadSeq).padStart(5, '0')}`;

          resolvedLead = await tx.leads.create({
            data: {
              org_id: safeOrgId,
              lead_number: leadNumber,
              academic_year_grade_id: aygId!,
              student_first_name: sFirst,
              student_last_name: sLast || undefined,
              dob: validDob,
              gender: (dto.gender?.toLowerCase() as any) || undefined,
              curriculum_preference: dto.curriculum_preference || 'CBSE',
              contact_name: parentFullName,
              contact_phone: dto.contact_phone || dto.parent_phone || '9999999999',
              contact_email: dto.contact_email || dto.parent_email || undefined,
              contact_relationship: (dto.contact_relationship?.toLowerCase() as any) || 'father',
              source: 'website' as any,
              stage: 'application_submitted' as any,
              remarks: dto.remarks || undefined,
              parent_id: parentRecord ? parentRecord.parent_id : undefined,
              created_by: performedBy || undefined,
            },
          });
        }

        // Generate application number
        const year = new Date().getFullYear();
        const lastApp = await tx.admissions_applications.findFirst({
          where: { application_number: { startsWith: `APP-${year}-` } },
          orderBy: { application_number: 'desc' },
          select: { application_number: true },
        });
        let nextAppSeq = 1;
        if (lastApp?.application_number) {
          const match = lastApp.application_number.match(/(\d+)$/);
          if (match) nextAppSeq = parseInt(match[1], 10) + 1;
        }
        const applicationNumber = `APP-${year}-${String(nextAppSeq).padStart(5, '0')}`;

        // Create the application linked to resolvedLead.lead_id
        const newApp = await tx.admissions_applications.create({
          data: {
            lead_id: resolvedLead.lead_id,
            org_id: safeOrgId,
            academic_year_id: safeAcademicYearId,
            application_number: applicationNumber,
            application_date: dto.application_date ? new Date(dto.application_date) : new Date(),
            status: dto.status || application_status.submitted,
            created_by: performedBy || undefined,
            nationality: dto.nationality || undefined,
            previous_school_name: dto.previous_school_name || dto.previous_school || undefined,
            previous_school_address: dto.previous_school_address || undefined,
            previous_school_board: dto.previous_school_board || undefined,
            previous_grade: dto.previous_grade || undefined,
            previous_school_year: dto.previous_school_year || undefined,
          } as any,
          include: {
            leads: true,
            academic_years: true,
          },
        });

        return newApp;
      },
      { maxWait: 5000, timeout: 10000 },
    );

    logger.info(`Admission application created: ${application.application_id}`, {
      applicationId: application.application_id,
      applicationNumber: application.application_number,
      leadId: application.lead_id,
      performedBy,
    });

    // Post-commit event emission
    await AdmissionEvents.publish(ApplicationEventType.CREATED, {
      applicationId: application.application_id,
      applicationNumber: application.application_number,
      leadId: application.lead_id,
      performedBy,
      timestamp: new Date().toISOString(),
    });

    return AdmissionMapper.toResponseDto(application);
  }

  static async getApplicationById(
    id: string,
    orgId?: string,
    parentUserId?: string,
  ): Promise<ApplicationResponseDto> {
    const app = await AdmissionRepository.findById(id, orgId, parentUserId);
    if (!app) {
      throw new ApplicationNotFoundError(id);
    }
    return AdmissionMapper.toResponseDto(app);
  }

  static async updateApplication(
    id: string,
    dto: any,
    performedBy?: string | null,
    orgId?: string,
  ): Promise<ApplicationResponseDto> {
    const existing = await AdmissionRepository.findById(id, orgId);
    if (!existing) {
      throw new ApplicationNotFoundError(id);
    }

    // Security Ownership Check: If performed by a parent user, verify application ownership
    if (performedBy) {
      const parent = await prisma.parents.findUnique({ where: { user_id: performedBy } });
      if (parent) {
        const isOwner =
          existing.leads?.parent_id === parent.parent_id || existing.created_by === performedBy;
        if (!isOwner) {
          throw new ApplicationValidationError('Unauthorized: You do not own this application');
        }
      }
    }

    if (dto.status && dto.status !== existing.status) {
      ApplicationValidator.validateStatusTransition(existing.status, dto.status);
    }

    // Sanitize payload: Stripping immutable keys
    const sanitizedDto = { ...dto };
    delete sanitizedDto.application_id;
    delete sanitizedDto.id;
    delete sanitizedDto.lead_id;
    delete sanitizedDto.created_by;
    delete sanitizedDto.created_at;
    delete sanitizedDto.application_number;

    const updated = await AdmissionRepository.update(id, sanitizedDto);

    logger.info(`Admission application updated: ${id}`, { applicationId: id, performedBy });

    // Post-commit event emission
    await AdmissionEvents.publish(ApplicationEventType.UPDATED, {
      applicationId: id,
      previousStatus: existing.status,
      newStatus: updated.status,
      performedBy,
      timestamp: new Date().toISOString(),
    });

    return AdmissionMapper.toResponseDto(updated);
  }

  static async updateStatus(
    id: string,
    targetStatus: application_status,
    performedBy?: string | null,
    isParentOnly?: boolean,
  ): Promise<ApplicationResponseDto> {
    const existing = await AdmissionRepository.findById(id);
    if (!existing) {
      throw new ApplicationNotFoundError(id);
    }

    if (performedBy && isParentOnly) {
      const parent = await prisma.parents.findUnique({ where: { user_id: performedBy } });
      const isOwner =
        (parent && existing.leads?.parent_id === parent.parent_id) ||
        existing.created_by === performedBy ||
        existing.leads?.created_by === performedBy;
      if (!isOwner) {
        throw new ApplicationForbiddenError('Unauthorized: You do not own this application');
      }
      if (targetStatus !== application_status.submitted) {
        throw new ApplicationForbiddenError(
          'Parents may only transition applications to submitted status',
        );
      }
    }

    ApplicationValidator.validateStatusTransition(existing.status, targetStatus);

    // If transitioning to submitted, enforce mandatory document completeness
    if (targetStatus === application_status.submitted) {
      const mandatoryDocTypes = await prisma.document_types.findMany({
        where: { org_id: existing.org_id, is_active: true, is_mandatory: true },
      });
      const uploadedDocTypeIds = new Set(
        (existing.admission_documents || []).map((d: any) => d.document_type_id),
      );
      const missingMandatory = mandatoryDocTypes.filter(
        (md) => !uploadedDocTypeIds.has(md.document_type_id),
      );
      if (missingMandatory.length > 0) {
        throw new ApplicationValidationError(
          `Cannot submit application: Missing mandatory document(s): ${missingMandatory.map((d) => d.document_name).join(', ')}`,
        );
      }
    }

    const updated = await AdmissionRepository.updateStatus(id, targetStatus);

    logger.info(
      `Admission application status changed: ${id} (${existing.status} -> ${targetStatus})`,
      {
        applicationId: id,
        previousStatus: existing.status,
        newStatus: targetStatus,
        performedBy,
      },
    );

    // Post-commit event emission
    await AdmissionEvents.publish(ApplicationEventType.STATUS_CHANGED, {
      applicationId: id,
      previousStatus: existing.status,
      newStatus: targetStatus,
      performedBy,
      timestamp: new Date().toISOString(),
    });

    return AdmissionMapper.toResponseDto(updated);
  }

  static async deleteApplication(
    id: string,
    performedBy?: string | null,
  ): Promise<{ success: boolean }> {
    const existing = await AdmissionRepository.findById(id);
    if (!existing) {
      throw new ApplicationNotFoundError(id);
    }

    // Downstream integrity check: If application has recorded decisions, paid fee records, or assessments, disallow hard delete
    const hasDecisions = !!existing.admission_decisions;
    const hasPaidFees =
      existing.admission_fee_payments &&
      (existing.admission_fee_payments.payment_status === 'paid' ||
        existing.admission_fee_payments.payment_status === 'partial');
    const hasCompletedAssessment =
      existing.application_assessments && existing.application_assessments.result !== null;

    if (hasDecisions || hasPaidFees || hasCompletedAssessment) {
      throw new ApplicationValidationError(
        'Cannot hard-delete an application with recorded decisions, paid fees, or assessments. Please transition the status to "withdrawn" instead.',
      );
    }

    const documentStoragePaths = (existing.admission_documents || [])
      .map((d: any) => d.storage_path)
      .filter(Boolean);

    await AdmissionRepository.delete(id);

    // Best-effort storage cleanup for attached admission documents
    if (documentStoragePaths.length > 0) {
      for (const storagePath of documentStoragePaths) {
        try {
          await StorageService.deleteFile(storagePath);
          logger.info(`Storage file deleted on application removal: ${storagePath}`);
        } catch (cleanupErr: any) {
          logger.warn(
            `Failed to clean up storage binary ${storagePath} during application deletion: ${cleanupErr.message}`,
          );
        }
      }
    }

    logger.info(`Admission application deleted: ${id}`, { applicationId: id, performedBy });

    // Post-commit event emission
    await AdmissionEvents.publish(ApplicationEventType.DELETED, {
      applicationId: id,
      performedBy,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  static async searchApplications(
    params: SearchApplicationDto,
  ): Promise<PaginatedResponse<ApplicationResponseDto>> {
    const result = await AdmissionSearchRepository.search(params);

    const mappedItems = result.items.map(AdmissionMapper.toResponseDto);

    return {
      data: mappedItems,
      items: mappedItems,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    } as any;
  }
}
