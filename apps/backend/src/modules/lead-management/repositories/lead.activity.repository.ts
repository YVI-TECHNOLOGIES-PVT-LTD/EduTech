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
    return prisma.lead_activities.update({
      where: { activity_id },
      data: {
        status: dto.status,
        next_followup_date: dto.next_followup_date ? new Date(dto.next_followup_date) : undefined,
        notes: dto.notes,
        updated_at: new Date(),
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

  static async delete(activity_id: string) {
    return prisma.lead_activities.delete({
      where: { activity_id },
    });
  }
}
