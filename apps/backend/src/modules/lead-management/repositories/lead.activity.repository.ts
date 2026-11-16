import { lead_activity_type, activity_status } from '@prisma/client';
import prisma from '../../../lib/prismaClient';
import { CreateActivityDto, UpdateActivityDto } from '../dto/request/create-activity.dto';

export class LeadActivityRepository {
  static async create(leadId: string, createdBy: string | null, dto: CreateActivityDto) {
    return prisma.lead_activities.create({
      data: {
        lead_id: leadId,
        created_by: createdBy || undefined,
        activity_type: dto.activity_type || dto.type || lead_activity_type.follow_up,
        activity_date: dto.activity_date ? new Date(dto.activity_date) : new Date(),
        status: dto.status || activity_status.completed,
        next_followup_date: dto.next_followup_date ? new Date(dto.next_followup_date) : undefined,
        notes: dto.notes || undefined,
      },
      include: {
        users_lead_activities_created_byTousers: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });
  }

  static async findByLeadId(leadId: string) {
    return prisma.lead_activities.findMany({
      where: { lead_id: leadId },
      include: {
        users_lead_activities_created_byTousers: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  static async findById(activity_id: string) {
    return prisma.lead_activities.findUnique({
      where: { activity_id },
      include: {
        leads: true,
        users_lead_activities_created_byTousers: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });
  }

  static async update(activity_id: string, dto: UpdateActivityDto) {
    const data: any = {
      updated_at: new Date(),
    };
    if (dto.activity_type || dto.type) {
      data.activity_type = dto.activity_type || dto.type;
    }
    if (dto.activity_date) {
      data.activity_date = new Date(dto.activity_date);
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
    }
    if (dto.next_followup_date !== undefined) {
      data.next_followup_date = dto.next_followup_date ? new Date(dto.next_followup_date) : null;
    }
    if (dto.notes !== undefined) {
      data.notes = dto.notes;
    }

    return prisma.lead_activities.update({
      where: { activity_id },
      data,
      include: {
        users_lead_activities_created_byTousers: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });
  }

  static async delete(activity_id: string) {
    return prisma.lead_activities.delete({
      where: { activity_id },
    });
  }

  static async findFollowUpsDue(params: {
    org_id?: string;
    staff_id?: string;
    date?: string;
    status?: activity_status;
    page?: number;
    pageSize?: number;
  }) {
    const where: any = {
      next_followup_date: { not: null },
    };

    if (params.org_id) {
      where.leads = { org_id: params.org_id };
    }

    if (params.status) {
      where.status = params.status;
    } else {
      where.status = { in: [activity_status.scheduled, activity_status.completed] };
    }

    if (params.date) {
      where.next_followup_date = { lte: new Date(params.date) };
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;

    const [total, items] = await Promise.all([
      prisma.lead_activities.count({ where }),
      prisma.lead_activities.findMany({
        where,
        include: {
          leads: {
            include: {
              academic_year_grades: {
                include: {
                  grades: true,
                },
              },
            },
          },
          users_lead_activities_created_byTousers: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: { next_followup_date: 'asc' },
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
}
