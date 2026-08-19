import { visit_type, visit_status } from '@prisma/client';
import prisma from '../../../lib/prismaClient';

export interface CreateVisitDto {
  lead_id: string;
  visit_type: visit_type;
  scheduled_at: string | Date;
  staff_id?: string | null;
  meeting_link?: string | null;
  remarks?: string | null;
}

export interface UpdateVisitDto {
  status?: visit_status;
  scheduled_at?: string | Date;
  staff_id?: string | null;
  meeting_link?: string | null;
  remarks?: string | null;
}

export class LeadVisitRepository {
  static async create(dto: CreateVisitDto, createdBy?: string | null) {
    return prisma.lead_visits.create({
      data: {
        lead_id: dto.lead_id,
        visit_type: dto.visit_type,
        scheduled_at: new Date(dto.scheduled_at),
        staff_id: dto.staff_id || undefined,
        meeting_link: dto.meeting_link || undefined,
        remarks: dto.remarks || undefined,
        created_by: createdBy || undefined,
      },
      include: {
        staff: true,
        leads: true,
      },
    });
  }

  static async findById(visit_id: string) {
    return prisma.lead_visits.findUnique({
      where: { visit_id },
      include: {
        staff: true,
        leads: true,
      },
    });
  }

  static async findByLeadId(lead_id: string) {
    return prisma.lead_visits.findMany({
      where: { lead_id },
      include: {
        staff: true,
      },
      orderBy: { scheduled_at: 'desc' },
    });
  }

  static async findQueue(params: {
    org_id?: string;
    staff_id?: string;
    visit_type?: visit_type;
    status?: visit_status;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    const where: any = {};
    if (params.org_id) {
      where.leads = { org_id: params.org_id };
    }
    if (params.staff_id) {
      where.staff_id = params.staff_id;
    }
    if (params.visit_type) {
      where.visit_type = params.visit_type;
    }
    if (params.status) {
      where.status = params.status;
    }
    if (params.startDate || params.endDate) {
      where.scheduled_at = {};
      if (params.startDate) where.scheduled_at.gte = new Date(params.startDate);
      if (params.endDate) where.scheduled_at.lte = new Date(params.endDate);
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;

    const [total, items] = await Promise.all([
      prisma.lead_visits.count({ where }),
      prisma.lead_visits.findMany({
        where,
        include: {
          staff: true,
          leads: {
            include: {
              academic_year_grades: true,
            },
          },
        },
        orderBy: { scheduled_at: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      items,
    };
  }

  static async update(visit_id: string, dto: UpdateVisitDto, updatedBy?: string | null) {
    const data: any = {
      updated_at: new Date(),
      updated_by: updatedBy || undefined,
    };

    if (dto.status) data.status = dto.status;
    if (dto.scheduled_at) data.scheduled_at = new Date(dto.scheduled_at);
    if (dto.staff_id !== undefined) data.staff_id = dto.staff_id || undefined;
    if (dto.meeting_link !== undefined) data.meeting_link = dto.meeting_link || undefined;
    if (dto.remarks !== undefined) data.remarks = dto.remarks || undefined;

    return prisma.lead_visits.update({
      where: { visit_id },
      data,
      include: {
        staff: true,
        leads: true,
      },
    });
  }

  static async delete(visit_id: string) {
    return prisma.lead_visits.delete({
      where: { visit_id },
    });
  }
}
