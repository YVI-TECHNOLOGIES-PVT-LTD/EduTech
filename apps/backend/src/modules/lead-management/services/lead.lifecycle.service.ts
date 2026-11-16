import prisma from '../../../lib/prismaClient';
import { Prisma, lead_stage, lead_activity_type, activity_status } from '@prisma/client';
import { LeadRepository } from '../repositories/lead.repository';
import { LeadValidator } from '../validators/lead.validator';
import { LeadNotFoundError, LeadValidationError } from '../errors/lead.errors';
import { LeadEvents, LeadEventType } from '../events/lead.events';
import { LeadMapper } from '../mappers/lead.mapper';
import { LeadResponseDto } from '../dto/response/lead.response.dto';
import { logger } from '../../../utils/logger';

export class LeadLifecycleService {
  static async updateStatus(
    id: string,
    targetStage: lead_stage,
    performedBy?: string | null,
    remarks?: string | null,
  ): Promise<LeadResponseDto> {
    const existing = await LeadRepository.findById(id);
    if (!existing) {
      throw new LeadNotFoundError(id);
    }

    LeadValidator.validateStatusTransition(existing.stage, targetStage, remarks);

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const leadUpdate = await tx.leads.update({
        where: { lead_id: id },
        data: {
          stage: targetStage,
          remarks: remarks !== undefined ? remarks : undefined,
          updated_at: new Date(),
          updated_by: performedBy || undefined,
        },
        include: {
          staff: {
            include: {
              users_staff_user_idTousers: {
                select: {
                  user_id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                },
              },
            },
          },
          academic_year_grades: {
            include: {
              grades: true,
              academic_years: true,
            },
          },
        },
      });

      // Record stage transition in lead_activities for auditability
      await tx.lead_activities.create({
        data: {
          lead_id: id,
          activity_type:
            targetStage === lead_stage.application_submitted
              ? lead_activity_type.application_submitted
              : targetStage === lead_stage.counselling_scheduled
                ? lead_activity_type.counselling
                : lead_activity_type.note,
          status: activity_status.completed,
          activity_date: new Date(),
          notes: `Stage transitioned from '${existing.stage.replace('_', ' ')}' to '${targetStage.replace('_', ' ')}'.${remarks ? ` Remarks: ${remarks}` : ''}`,
          created_by: performedBy || undefined,
        },
      });

      return leadUpdate;
    });

    logger.info(`Lead stage updated for lead ${id}: ${existing.stage} -> ${targetStage}`, {
      leadId: id,
      previousStage: existing.stage,
      newStage: targetStage,
      performedBy,
    });

    await LeadEvents.publish(LeadEventType.STATUS_CHANGED, {
      leadId: id,
      orgId: existing.org_id,
      previousStatus: existing.stage,
      newStatus: targetStage,
      performedBy,
      timestamp: new Date().toISOString(),
    });

    await LeadEvents.publish(LeadEventType.ACTIVITY_ADDED, {
      leadId: id,
      orgId: existing.org_id,
      performedBy,
      timestamp: new Date().toISOString(),
      metadata: { stage: targetStage },
    });

    if (targetStage === lead_stage.qualified) {
      await LeadEvents.publish(LeadEventType.QUALIFIED, {
        leadId: id,
        orgId: existing.org_id,
        performedBy,
        timestamp: new Date().toISOString(),
      });
    } else if (targetStage === lead_stage.enrolled) {
      await LeadEvents.publish(LeadEventType.CONVERTED, {
        leadId: id,
        orgId: existing.org_id,
        performedBy,
        timestamp: new Date().toISOString(),
      });
    }

    return LeadMapper.toResponseDto(updated);
  }

  static async convertToApplication(leadId: string, performedBy?: string | null, orgId?: string) {
    const lead = await LeadRepository.findById(leadId);
    if (!lead) {
      throw new LeadNotFoundError(leadId);
    }
    if (orgId && lead.org_id !== orgId) {
      throw new LeadNotFoundError(leadId);
    }

    // Check if application already exists for this lead
    const existingApp = await prisma.admissions_applications.findFirst({
      where: { lead_id: leadId },
    });
    if (existingApp) {
      return existingApp;
    }

    // Resolve academic year ID
    let academicYearId = '';
    if (lead.academic_year_grades?.academic_year_id) {
      academicYearId = lead.academic_year_grades.academic_year_id;
    } else {
      const activeYear = await prisma.academic_years.findFirst({
        where: { org_id: lead.org_id },
        orderBy: { created_at: 'desc' },
      });
      academicYearId = activeYear?.academic_year_id || '';
    }

    if (!academicYearId) {
      throw new LeadValidationError('Academic year not configured for organization');
    }

    // Generate collision-checked application_number
    const year = new Date().getFullYear();
    let count = await prisma.admissions_applications.count({ where: { org_id: lead.org_id } });
    let applicationNumber = `APP-${year}-${String(count + 1).padStart(5, '0')}`;
    let attempts = 0;
    while (attempts < 10) {
      const exists = await prisma.admissions_applications.findUnique({
        where: { application_number: applicationNumber },
      });
      if (!exists) break;
      count += 1;
      applicationNumber = `APP-${year}-${String(count + 1).padStart(5, '0')}`;
      attempts += 1;
    }

    // Atomic transaction for Application creation + Lead stage update + Activity record
    let application: any;
    let isNew = true;

    try {
      application = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const app = await tx.admissions_applications.create({
          data: {
            lead_id: leadId,
            org_id: lead.org_id,
            academic_year_id: academicYearId,
            application_number: applicationNumber,
            status: 'submitted',
            created_by: performedBy || undefined,
          },
        });

        await tx.leads.update({
          where: { lead_id: leadId },
          data: {
            stage: lead_stage.application_submitted,
            updated_at: new Date(),
            updated_by: performedBy || undefined,
          },
        });

        await tx.lead_activities.create({
          data: {
            lead_id: leadId,
            activity_type: lead_activity_type.application_submitted,
            status: activity_status.completed,
            activity_date: new Date(),
            notes: `Application ${applicationNumber} created. Lead advanced to 'Application Submitted'.`,
            created_by: performedBy || undefined,
          },
        });

        return app;
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const raceApp = await prisma.admissions_applications.findFirst({
          where: { lead_id: leadId },
        });
        if (raceApp) {
          application = raceApp;
          isNew = false;
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    if (isNew) {
      logger.info(`Lead ${leadId} converted to Application ${application.application_number}`, {
        leadId,
        applicationId: application.application_id,
        applicationNumber: application.application_number,
        performedBy,
      });

      await LeadEvents.publish(LeadEventType.CONVERTED, {
        leadId,
        orgId: lead.org_id,
        performedBy,
        timestamp: new Date().toISOString(),
        metadata: {
          applicationId: application.application_id,
          applicationNumber: application.application_number,
        },
      });

      await LeadEvents.publish(LeadEventType.STATUS_CHANGED, {
        leadId,
        orgId: lead.org_id,
        previousStatus: lead.stage,
        newStatus: lead_stage.application_submitted,
        performedBy,
        timestamp: new Date().toISOString(),
      });

      await LeadEvents.publish(LeadEventType.ACTIVITY_ADDED, {
        leadId,
        orgId: lead.org_id,
        performedBy,
        timestamp: new Date().toISOString(),
        metadata: { activityType: 'application_submitted' },
      });
    }

    return application;
  }
}
