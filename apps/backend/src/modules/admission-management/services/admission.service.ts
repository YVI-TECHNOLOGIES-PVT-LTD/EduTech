import prisma from '../../../lib/prismaClient';
import { application_status } from '@prisma/client';
import { AdmissionRepository } from '../repositories/admission.repository';
import { AdmissionSearchRepository } from '../repositories/admission.search.repository';
import { ApplicationValidator } from '../validators/application.validator';
import {
  ApplicationNotFoundError,
  DuplicateApplicationError,
  ApplicationValidationError,
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
import { logger } from '../../../utils/logger';

export class AdmissionService {
  static async createApplication(
    dto: CreateApplicationDto,
    performedBy?: string | null,
    userOrgId?: string,
  ): Promise<ApplicationResponseDto> {
    ApplicationValidator.validateCreate(dto);

    let targetLeadId = dto.lead_id;
    let targetOrgId = dto.org_id || dto.school_id || userOrgId;
    if (!targetOrgId) {
      const activeOrg = await prisma.organizations.findFirst({ where: { status: 'active' } });
      targetOrgId = activeOrg?.org_id;
    }
    if (!targetOrgId) {
      throw new ApplicationValidationError('Organization ID is required');
    }

    let targetAcademicYearId = dto.academic_year_id;
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

    let application: any;

    if (targetLeadId) {
      const existingLeadApp = await AdmissionRepository.findByLeadId(targetLeadId);
      if (existingLeadApp) {
        throw new DuplicateApplicationError(targetLeadId);
      }
      application = await AdmissionRepository.create(
        {
          ...dto,
          lead_id: targetLeadId,
          org_id: targetOrgId,
          academic_year_id: targetAcademicYearId,
        },
        performedBy,
      );
    } else {
      application = await prisma.$transaction(async (tx) => {
        let aygId = dto.academic_year_grade_id;
        if (!aygId && dto.grade_id) {
          const ayg = await tx.academic_year_grades.findFirst({
            where: { academic_year_id: targetAcademicYearId, grade_id: dto.grade_id },
          });
          aygId = ayg?.academic_year_grade_id;
        }
        if (!aygId && dto.grade_applied_for) {
          const matchedGrade = await tx.grades.findFirst({
            where: { org_id: targetOrgId, grade_name: dto.grade_applied_for },
          });
          if (matchedGrade) {
            const ayg = await tx.academic_year_grades.findFirst({
              where: { academic_year_id: targetAcademicYearId, grade_id: matchedGrade.grade_id },
            });
            aygId = ayg?.academic_year_grade_id;
          }
        }
        if (!aygId) {
          const ayg = await tx.academic_year_grades.findFirst({
            where: { academic_year_id: targetAcademicYearId, is_active: true },
          });
          aygId = ayg?.academic_year_grade_id;
        }
        if (!aygId) {
          throw new ApplicationValidationError('Grade offering not found for academic year');
        }

        const year = new Date().getFullYear();
        const leadCount = await tx.leads.count();
        let leadSeq = leadCount + 1;
        let leadNumber = `LEAD-${year}-${String(leadSeq).padStart(5, '0')}`;
        while (await tx.leads.findUnique({ where: { lead_number: leadNumber } })) {
          leadSeq++;
          leadNumber = `LEAD-${year}-${String(leadSeq).padStart(5, '0')}`;
        }

        let sFirst = dto.student_first_name || '';
        let sLast = dto.student_last_name || '';
        if (!sFirst && dto.student_name) {
          const parts = dto.student_name.trim().split(' ');
          sFirst = parts[0];
          sLast = parts.slice(1).join(' ');
        }
        if (!sFirst) sFirst = 'Applicant';

        let pFirst = dto.parent_first_name || '';
        let pLast = dto.parent_last_name || '';
        if (!pFirst && dto.parent_name) {
          const parts = dto.parent_name.trim().split(' ');
          pFirst = parts[0];
          pLast = parts.slice(1).join(' ');
        }
        const parentFullName = `${pFirst} ${pLast}`.trim() || 'Parent User';

        const parsedDob = dto.date_of_birth ? new Date(dto.date_of_birth) : undefined;
        const validDob = parsedDob && !isNaN(parsedDob.getTime()) ? parsedDob : undefined;

        const newLead = await tx.leads.create({
          data: {
            org_id: targetOrgId!,
            lead_number: leadNumber,
            academic_year_grade_id: aygId,
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
            created_by: performedBy || undefined,
          },
        });

        const appCount = await tx.admissions_applications.count();
        let appSeq = appCount + 1;
        let applicationNumber = `APP-${year}-${String(appSeq).padStart(5, '0')}`;
        while (
          await tx.admissions_applications.findUnique({
            where: { application_number: applicationNumber },
          })
        ) {
          appSeq++;
          applicationNumber = `APP-${year}-${String(appSeq).padStart(5, '0')}`;
        }

        const newApp = await tx.admissions_applications.create({
          data: {
            lead_id: newLead.lead_id,
            org_id: targetOrgId!,
            academic_year_id: targetAcademicYearId!,
            application_number: applicationNumber,
            application_date: dto.application_date ? new Date(dto.application_date) : new Date(),
            status: dto.status || application_status.submitted,
            created_by: performedBy || undefined,
          },
          include: {
            leads: true,
            academic_years: true,
          },
        });

        return newApp;
      });
    }

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
    dto: UpdateApplicationDto,
    performedBy?: string | null,
    orgId?: string,
  ): Promise<ApplicationResponseDto> {
    const existing = await AdmissionRepository.findById(id, orgId);
    if (!existing) {
      throw new ApplicationNotFoundError(id);
    }

    if (dto.status && dto.status !== existing.status) {
      ApplicationValidator.validateStatusTransition(existing.status, dto.status);
    }

    const updated = await AdmissionRepository.update(id, dto);

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
  ): Promise<ApplicationResponseDto> {
    const existing = await AdmissionRepository.findById(id);
    if (!existing) {
      throw new ApplicationNotFoundError(id);
    }

    ApplicationValidator.validateStatusTransition(existing.status, targetStatus);

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

    await AdmissionRepository.delete(id);

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

    return {
      data: result.items.map(AdmissionMapper.toResponseDto),
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    };
  }
}
