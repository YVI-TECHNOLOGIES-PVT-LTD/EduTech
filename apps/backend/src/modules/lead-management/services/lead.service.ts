import { LeadRepository } from '../repositories/lead.repository';
import { LeadSearchRepository } from '../repositories/lead.search.repository';
import { LeadValidator } from '../validators/lead.validator';
import { LeadNotFoundError, LeadError } from '../errors/lead.errors';
import { CreateLeadDto } from '../dto/request/create-lead.dto';
import { UpdateLeadDto } from '../dto/request/update-lead.dto';
import { SearchLeadDto } from '../dto/request/search-lead.dto';
import { LeadMapper } from '../mappers/lead.mapper';
import { LeadResponseDto, PaginatedResponse } from '../dto/response/lead.response.dto';
import { LeadDashboardQuery } from '../queries/lead.dashboard';
import { LeadDashboardDto } from '../dto/response/lead-dashboard.dto';
import { LeadEvents, LeadEventType } from '../events/lead.events';
import { logger } from '../../../utils/logger';

export class LeadService {
  static async createLead(
    dto: CreateLeadDto,
    performedBy?: string | null,
  ): Promise<LeadResponseDto> {
    LeadValidator.validateCreate(dto);

    // Duplicate Check
    const duplicates = await LeadRepository.findDuplicates(
      String(dto.contact_phone),
      dto.contact_email ? String(dto.contact_email) : undefined,
      dto.contact_name ? String(dto.contact_name) : undefined,
    );
    if (duplicates.length > 0) {
      logger.warn(`Potential duplicate lead detected for phone ${dto.contact_phone}`, {
        phone: dto.contact_phone,
        email: dto.contact_email,
        matchingLeads: duplicates.map((d: any) => d.lead_id),
      });
    }

    const lead = await LeadRepository.create(dto);

    logger.info(`Lead created successfully: ${lead.lead_id}`, {
      leadId: lead.lead_id,
      leadNumber: lead.lead_number,
      studentFirstName: dto.student_first_name,
      performedBy,
    });

    await LeadEvents.publish(LeadEventType.CREATED, {
      leadId: lead.lead_id,
      studentName: dto.student_first_name,
      performedBy: performedBy ? String(performedBy) : undefined,
      timestamp: new Date().toISOString(),
      metadata: { leadNumber: lead.lead_number },
    });

    return LeadMapper.toResponseDto(lead);
  }

  static async getLeadById(id: string, user?: any): Promise<LeadResponseDto> {
    const lead = await LeadRepository.findById(id);
    if (!lead) {
      throw new LeadNotFoundError(id);
    }

    if (user) {
      if (user.roles?.includes('PARENT')) {
        const isOwner =
          lead.org_id === user.org_id &&
          (lead.created_by === user.id ||
            lead.contact_phone === user.phone ||
            lead.contact_email === user.email);
        if (!isOwner) {
          throw new LeadError('Forbidden: Access denied to lead', 403, 'FORBIDDEN');
        }
      } else if (lead.org_id !== user.org_id && !user.roles?.includes('SUPERADMIN')) {
        throw new LeadError('Forbidden: Tenant isolation mismatch', 403, 'TENANT_MISMATCH');
      }
    }

    return LeadMapper.toResponseDto(lead);
  }

  static async updateLead(
    id: string,
    dto: UpdateLeadDto,
    performedBy?: string | null,
    user?: any,
  ): Promise<LeadResponseDto> {
    const existing = await LeadRepository.findById(id);
    if (!existing) {
      throw new LeadNotFoundError(id);
    }

    if (user) {
      if (user.roles?.includes('PARENT')) {
        const isOwner =
          existing.org_id === user.org_id &&
          (existing.created_by === user.id ||
            existing.contact_phone === user.phone ||
            existing.contact_email === user.email);
        if (!isOwner) {
          throw new LeadError('Forbidden: Access denied to lead', 403, 'FORBIDDEN');
        }
        delete (dto as any).stage;
        delete (dto as any).status;
        delete (dto as any).priority;
        delete (dto as any).assigned_counsellor_id;
        delete (dto as any).org_id;
      } else if (existing.org_id !== user.org_id && !user.roles?.includes('SUPERADMIN')) {
        throw new LeadError('Forbidden: Tenant isolation mismatch', 403, 'TENANT_MISMATCH');
      }
    }

    const updated = await LeadRepository.update(id, dto);
    if (!updated) {
      throw new LeadNotFoundError(id);
    }

    logger.info(`Lead updated: ${id}`, { leadId: id, performedBy });

    await LeadEvents.publish(LeadEventType.UPDATED, {
      leadId: id,
      performedBy,
      timestamp: new Date().toISOString(),
    });

    return LeadMapper.toResponseDto(updated);
  }

  static async deleteLead(id: string, performedBy?: string | null): Promise<{ success: boolean }> {
    const existing = await LeadRepository.findById(id);
    if (!existing) {
      throw new LeadNotFoundError(id);
    }

    await LeadRepository.delete(id);

    logger.info(`Lead deleted: ${id}`, { leadId: id, performedBy });

    await LeadEvents.publish(LeadEventType.DELETED, {
      leadId: id,
      performedBy,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  static async searchLeads(
    params: SearchLeadDto,
    user?: any,
  ): Promise<PaginatedResponse<LeadResponseDto>> {
    const result = await LeadSearchRepository.search(params, user);

    return {
      data: result.items.map(LeadMapper.toResponseDto),
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

  static async checkDuplicates(phone: string, email?: string | null, contactName?: string) {
    const matches = await LeadRepository.findDuplicates(phone, email, contactName);
    return {
      isDuplicate: matches.length > 0,
      count: matches.length,
      matches: matches.map((m: any) => ({
        lead_id: m.lead_id,
        id: m.lead_id,
        lead_number: m.lead_number,
        student_name: [m.student_first_name, m.student_last_name].filter(Boolean).join(' '),
        contact_name: m.contact_name,
        contact_phone: m.contact_phone,
        contact_email: m.contact_email,
        created_at: m.created_at,
      })),
    };
  }

  static async getDashboardMetrics(orgId?: string): Promise<LeadDashboardDto> {
    return LeadDashboardQuery.execute(orgId);
  }
}
