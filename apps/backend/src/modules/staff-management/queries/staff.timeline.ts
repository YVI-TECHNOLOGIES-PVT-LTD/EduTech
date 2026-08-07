import prisma from '../../../lib/prismaClient';
import { StaffTimelineDto, StaffTimelineEventDto } from '../dto/response/staff-timeline.dto';

const db: any = prisma;

export class StaffTimelineQuery {
  static async execute(staffId: string): Promise<StaffTimelineDto> {
    const staff = await db.staff.findUnique({
      where: { staff_id: staffId },
      include: {
        users_staff_user_idTousers: true,
        designations: true,
      },
    });

    if (!staff) {
      return { staff_id: staffId, timeline: [] };
    }

    const timeline: StaffTimelineEventDto[] = [];
    const staffName = staff.users_staff_user_idTousers
      ? [staff.users_staff_user_idTousers.first_name, staff.users_staff_user_idTousers.last_name]
          .filter(Boolean)
          .join(' ')
      : staff.employee_code;

    // 1. Staff Record Creation
    if (staff.created_at) {
      timeline.push({
        id: `created-${staff.staff_id}`,
        type: 'STAFF_CREATED',
        title: 'Staff Profile Created',
        description: `Employee Code: ${staff.employee_code} (${staffName})`.trim(),
        performed_by: staff.created_by || null,
        timestamp: new Date(staff.created_at).toISOString(),
      });
    }

    // 2. Joining Date
    if (staff.joining_date) {
      timeline.push({
        id: `joining-${staff.staff_id}`,
        type: 'STAFF_UPDATED',
        title: 'Official Joining Date',
        description: `Joined organization on ${new Date(staff.joining_date).toISOString().split('T')[0]}`,
        performed_by: staff.created_by || null,
        timestamp: new Date(staff.joining_date).toISOString(),
      });
    }

    // 3. Designation Assignment
    if (staff.designations?.designation_name) {
      timeline.push({
        id: `desig-${staff.staff_id}`,
        type: 'DESIGNATION_ASSIGNED',
        title: 'Designation Assigned',
        description: `Assigned as ${staff.designations.designation_name}`,
        performed_by: staff.updated_by || null,
        timestamp: new Date(staff.updated_at || staff.created_at).toISOString(),
      });
    }

    // Sort timeline chronologically descending
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      staff_id: staffId,
      timeline,
    };
  }
}
