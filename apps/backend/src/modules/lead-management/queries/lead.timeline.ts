import prisma from '../../../lib/prismaClient';
import { LeadTimelineDto, TimelineEventDto } from '../dto/response/lead-timeline.dto';

export class LeadTimelineQuery {
  static async execute(leadId: string): Promise<LeadTimelineDto> {
    const lead = await prisma.leads.findUnique({
      where: { lead_id: leadId },
      include: {
        staff: {
          include: {
            users_staff_user_idTousers: true,
          },
        },
        lead_activities: {
          include: {
            users_lead_activities_created_byTousers: true,
          },
          orderBy: { created_at: 'desc' },
        },
        lead_visits: {
          include: {
            staff: {
              include: {
                users_staff_user_idTousers: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!lead) {
      return { lead_id: leadId, timeline: [] };
    }

    const timeline: TimelineEventDto[] = [];

    // Lead Created Event
    if (lead.created_at) {
      timeline.push({
        id: `created-${lead.lead_id}`,
        type: 'CREATED',
        title: 'Lead Created',
        description: `Lead registered for ${lead.student_first_name} ${lead.student_last_name || ''}`.trim(),
        performed_by: lead.created_by || null,
        performed_by_name: 'System / Public',
        timestamp: new Date(lead.created_at).toISOString(),
      });
    }

    // Counselor Assignment Event
    if (lead.assigned_counsellor_id && lead.staff) {
      const staffUser = lead.staff.users_staff_user_idTousers;
      const staffName = staffUser
        ? [staffUser.first_name, staffUser.last_name].filter(Boolean).join(' ') || staffUser.email
        : lead.staff.employee_code;

      timeline.push({
        id: `assign-${lead.lead_id}`,
        type: 'ASSIGNMENT',
        title: 'Counselor Assigned',
        description: `Assigned to counselor: ${staffName}`,
        performed_by: lead.assigned_counsellor_id,
        performed_by_name: staffName,
        timestamp: new Date(lead.updated_at || lead.created_at || Date.now()).toISOString(),
      });
    }

    // Activities
    for (const act of lead.lead_activities || []) {
      const user = act.users_lead_activities_created_byTousers;
      const userName = user
        ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email
        : 'Staff';

      timeline.push({
        id: `activity-${act.activity_id}`,
        type: 'ACTIVITY',
        title: `Activity: ${act.activity_type.toUpperCase()} (${act.status.toUpperCase()})`,
        description: act.notes || `${act.activity_type} logged`,
        performed_by: act.created_by,
        performed_by_name: userName,
        timestamp: act.created_at ? new Date(act.created_at).toISOString() : new Date().toISOString(),
        metadata: {
          activity_type: act.activity_type,
          activity_date: act.activity_date ? new Date(act.activity_date).toISOString() : null,
          next_followup_date: act.next_followup_date ? new Date(act.next_followup_date).toISOString() : null,
          status: act.status,
        },
      });
    }

    // Visits
    for (const visit of lead.lead_visits || []) {
      const visitStaffUser = visit.staff?.users_staff_user_idTousers;
      const visitStaffName = visitStaffUser
        ? [visitStaffUser.first_name, visitStaffUser.last_name].filter(Boolean).join(' ') || visitStaffUser.email
        : 'Staff';

      timeline.push({
        id: `visit-${visit.visit_id}`,
        type: 'ACTIVITY',
        title: `Visit: ${visit.visit_type.toUpperCase()} (${visit.status.toUpperCase()})`,
        description: visit.remarks || `${visit.visit_type} scheduled`,
        performed_by: visit.staff_id,
        performed_by_name: visitStaffName,
        timestamp: visit.scheduled_at ? new Date(visit.scheduled_at).toISOString() : new Date().toISOString(),
        metadata: {
          visit_type: visit.visit_type,
          scheduled_at: visit.scheduled_at ? new Date(visit.scheduled_at).toISOString() : null,
          status: visit.status,
          meeting_link: visit.meeting_link,
        },
      });
    }

    // Sort timeline chronologically descending
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      lead_id: leadId,
      timeline,
    };
  }
}
