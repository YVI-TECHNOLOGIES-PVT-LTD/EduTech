import { application_status } from '@prisma/client';
import { AdmissionRepository } from '../repositories/admission.repository';
import { AdmissionSearchRepository } from '../repositories/admission.search.repository';
import { ApplicationValidator } from '../validators/application.validator';
import { ApplicationNotFoundError, DuplicateApplicationError } from '../errors/admission.errors';
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
  ): Promise<ApplicationResponseDto> {
    ApplicationValidator.validateCreate(dto);

    const existingLeadApp = await AdmissionRepository.findByLeadId(dto.lead_id);
    if (existingLeadApp) {
      throw new DuplicateApplicationError(dto.lead_id);
    }

    const application = await AdmissionRepository.create(dto);

    logger.info(`Admission application created: ${application.application_id}`, {
      applicationId: application.application_id,
      applicationNumber: application.application_number,
      leadId: dto.lead_id,
      performedBy,
    });

    // Post-commit event emission
    await AdmissionEvents.publish(ApplicationEventType.CREATED, {
      applicationId: application.application_id,
      applicationNumber: application.application_number,
      leadId: dto.lead_id,
      performedBy,
      timestamp: new Date().toISOString(),
    });

    return AdmissionMapper.toResponseDto(application);
  }

  static async getApplicationById(id: string): Promise<ApplicationResponseDto> {
    const app = await AdmissionRepository.findById(id);
    if (!app) {
      throw new ApplicationNotFoundError(id);
    }
    return AdmissionMapper.toResponseDto(app);
  }

  static async updateApplication(
    id: string,
    dto: UpdateApplicationDto,
    performedBy?: string | null,
  ): Promise<ApplicationResponseDto> {
    const existing = await AdmissionRepository.findById(id);
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
