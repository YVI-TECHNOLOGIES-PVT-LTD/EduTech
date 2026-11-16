import { LeadRepository } from '../repositories/lead.repository';
import { LeadNotFoundError, LeadAssignmentError } from '../errors/lead.errors';
import { LeadEvents, LeadEventType } from '../events/lead.events';
import { LeadMapper } from '../mappers/lead.mapper';
import { LeadResponseDto } from '../dto/response/lead.response.dto';
import { logger } from '../../../utils/logger';
import prisma from '../../../lib/prismaClient';

export class LeadAssignmentService {
  private static async validateCounselor(counselorId: string, orgId?: string): Promise<void> {
    const staff = await (prisma as any).staff.findUnique({
      where: { staff_id: counselorId },
      include: {
        users_staff_user_idTousers: {
          include: {
            user_roles_user_roles_user_idTousers: {
              include: {
                roles: true,
              },
            },
          },
        },
        designations: true,
      },
    });

    if (!staff) {
      throw new LeadAssignmentError(`Staff member with ID '${counselorId}' was not found`);
    }

    if (orgId && staff.org_id !== orgId) {
      throw new LeadAssignmentError(`Staff member does not belong to the current organization`);
    }

    if (!staff.is_active) {
      throw new LeadAssignmentError(`Staff member '${staff.employee_code}' is not active`);
    }

    const user = staff.users_staff_user_idTousers;
    if (!user || user.status !== 'active') {
      throw new LeadAssignmentError(`User account for staff member is not active`);
    }

    const roles: string[] =
      user.user_roles_user_roles_user_idTousers
        ?.map((ur: any) => ur.roles?.role_name?.toLowerCase())
        .filter(Boolean) || [];

    const isCounsellorRole = roles.some((r: string) => r.includes('counsel'));
    const designationName = (staff.designations?.designation_name || '').toLowerCase();
    const isCounsellorDesignation = designationName.includes('counsel');

    if (!isCounsellorRole && !isCounsellorDesignation) {
      throw new LeadAssignmentError(
        `Selected staff member '${user.first_name} ${user.last_name || ''}'.trim() does not have the Counsellor role`,
      );
    }
  }

  static async assignCounselor(
    id: string,
    counselorId: string | null,
    performedBy?: string | null,
    remarks?: string,
    orgId?: string,
  ): Promise<LeadResponseDto> {
    const existing = await LeadRepository.findById(id);
    if (!existing) {
      throw new LeadNotFoundError(id);
    }

    const sanitizedCounselorId =
      counselorId && counselorId.trim() !== '' ? counselorId.trim() : null;

    if (sanitizedCounselorId) {
      await this.validateCounselor(sanitizedCounselorId, orgId || existing.org_id);
    }

    const updated = await LeadRepository.assignCounselor(id, sanitizedCounselorId, remarks);

    logger.info(
      sanitizedCounselorId
        ? `Assigned counselor ${sanitizedCounselorId} to lead ${id}`
        : `Unassigned counselor from lead ${id}`,
      {
        leadId: id,
        counselorId: sanitizedCounselorId,
        performedBy,
        remarks,
      },
    );

    await LeadEvents.publish(LeadEventType.ASSIGNED, {
      leadId: id,
      counselorId: sanitizedCounselorId,
      performedBy,
      timestamp: new Date().toISOString(),
      metadata: { remarks, isUnassigned: !sanitizedCounselorId },
    });

    return LeadMapper.toResponseDto(updated);
  }

  static async unassignCounselor(
    id: string,
    performedBy?: string | null,
    remarks?: string,
  ): Promise<LeadResponseDto> {
    return this.assignCounselor(id, null, performedBy, remarks);
  }

  static async bulkAssignCounselor(
    leadIds: string[],
    counselorId: string | null,
    performedBy?: string | null,
    remarks?: string,
    orgId?: string,
  ): Promise<{ updatedCount: number }> {
    const sanitizedCounselorId =
      counselorId && counselorId.trim() !== '' ? counselorId.trim() : null;

    if (sanitizedCounselorId) {
      await this.validateCounselor(sanitizedCounselorId, orgId);
    }

    const result = await LeadRepository.bulkAssignCounselor(leadIds, sanitizedCounselorId);

    logger.info(
      sanitizedCounselorId
        ? `Bulk assigned counselor ${sanitizedCounselorId} to ${result.count} leads`
        : `Bulk unassigned counselor from ${result.count} leads`,
      {
        leadCount: result.count,
        counselorId: sanitizedCounselorId,
        performedBy,
        remarks,
      },
    );

    for (const leadId of leadIds) {
      await LeadEvents.publish(LeadEventType.ASSIGNED, {
        leadId,
        counselorId: sanitizedCounselorId,
        performedBy,
        timestamp: new Date().toISOString(),
        metadata: { remarks, isUnassigned: !sanitizedCounselorId },
      });
    }

    return { updatedCount: result.count };
  }
}
