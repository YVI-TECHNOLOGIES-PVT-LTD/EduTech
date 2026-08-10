import prisma from '../../../lib/prismaClient';
import { visit_type, visit_status } from '@prisma/client';
import { LeadError } from '../errors/lead.errors';
import { logger } from '../../../utils/logger';

const db: any = prisma;

export interface CreateVisitDto {
  lead_id: string;
  visit_type: visit_type;
  scheduled_at: string | Date;
  remarks?: string;
  meeting_link?: string;
}

export class LeadVisitService {
  static async getVisitsByLead(leadId: string, user: any) {
    const lead = await db.leads.findUnique({ where: { lead_id: leadId } });
    if (!lead) {
      throw new LeadError('Lead not found', 404, 'LEAD_NOT_FOUND');
    }

    // Tenant and Parent Ownership Enforcement
    if (user.roles.includes('PARENT')) {
      const isOwner =
        lead.org_id === user.org_id &&
        (lead.created_by === user.id ||
          lead.contact_phone === user.phone ||
          lead.contact_email === user.email);

      if (!isOwner) {
        throw new LeadError('Forbidden: Access denied to lead visits', 403, 'FORBIDDEN');
      }
    } else if (lead.org_id !== user.org_id && !user.roles.includes('SUPERADMIN')) {
      throw new LeadError('Forbidden: Tenant isolation mismatch', 403, 'TENANT_MISMATCH');
    }

    return db.lead_visits.findMany({
      where: { lead_id: leadId },
      orderBy: { scheduled_at: 'asc' },
    });
  }

  static async createVisit(dto: CreateVisitDto, user: any) {
    const lead = await db.leads.findUnique({ where: { lead_id: dto.lead_id } });
    if (!lead) {
      throw new LeadError('Lead not found', 404, 'LEAD_NOT_FOUND');
    }

    // Security Check
    if (user.roles.includes('PARENT')) {
      const isOwner =
        lead.org_id === user.org_id &&
        (lead.created_by === user.id ||
          lead.contact_phone === user.phone ||
          lead.contact_email === user.email);

      if (!isOwner) {
        throw new LeadError(
          'Forbidden: Cannot schedule visit for another parent lead',
          403,
          'FORBIDDEN',
        );
      }
    } else if (lead.org_id !== user.org_id && !user.roles.includes('SUPERADMIN')) {
      throw new LeadError('Forbidden: Tenant isolation mismatch', 403, 'TENANT_MISMATCH');
    }

    const scheduledAt = new Date(dto.scheduled_at);
    if (isNaN(scheduledAt.getTime())) {
      throw new LeadError('Invalid scheduled_at date format', 400, 'INVALID_DATE');
    }

    const visit = await db.lead_visits.create({
      data: {
        lead_id: dto.lead_id,
        visit_type: dto.visit_type,
        scheduled_at: scheduledAt,
        status: 'scheduled',
        meeting_link: dto.meeting_link || undefined,
        remarks: dto.remarks || undefined,
        created_by: user.id,
      },
    });

    logger.info(`Lead visit scheduled: ${visit.visit_id} for lead ${dto.lead_id}`, {
      visitId: visit.visit_id,
      leadId: dto.lead_id,
      visitType: dto.visit_type,
      performedBy: user.id,
    });

    return visit;
  }

  static async updateVisit(
    visitId: string,
    status: visit_status,
    remarks: string | undefined,
    user: any,
  ) {
    const visit = await db.lead_visits.findUnique({
      where: { visit_id: visitId },
      include: { leads: true },
    });

    if (!visit) {
      throw new LeadError('Visit not found', 404, 'VISIT_NOT_FOUND');
    }

    const lead = visit.leads;
    if (user.roles.includes('PARENT')) {
      const isOwner =
        lead.org_id === user.org_id &&
        (lead.created_by === user.id ||
          lead.contact_phone === user.phone ||
          lead.contact_email === user.email);

      if (!isOwner) {
        throw new LeadError('Forbidden: Access denied to visit', 403, 'FORBIDDEN');
      }

      // Parents can ONLY cancel their visits; they cannot mark them completed or no-show
      if (status !== 'cancelled') {
        throw new LeadError(
          'Forbidden: Parents can only cancel scheduled visits',
          403,
          'FORBIDDEN_STATUS_CHANGE',
        );
      }
    } else if (lead.org_id !== user.org_id && !user.roles.includes('SUPERADMIN')) {
      throw new LeadError('Forbidden: Tenant isolation mismatch', 403, 'TENANT_MISMATCH');
    }

    return db.lead_visits.update({
      where: { visit_id: visitId },
      data: {
        status,
        remarks: remarks !== undefined ? remarks : visit.remarks,
        updated_at: new Date(),
        updated_by: user.id,
      },
    });
  }
}
