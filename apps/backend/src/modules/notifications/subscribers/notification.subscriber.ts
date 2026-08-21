import { EventBus } from '../../../workflows/event-bus.service';
import { LeadEventType, LeadEventPayload } from '../../lead-management/events/lead.events';
import {
  ApplicationEventType,
  ApplicationEventPayload,
} from '../../admission-management/events/admission.events';
import {
  StudentEventType,
  StudentEventPayload,
} from '../../student-management/events/student.events';
import { NotificationService } from '../services/notification.service';
import { notification_category, notification_priority } from '../dto/notification.dto';
import prisma from '../../../lib/prismaClient';
import { logger } from '../../../utils/logger';

const db: any = prisma;

export class NotificationSubscriber {
  private static registered = false;

  public static register(): void {
    if (this.registered) return;
    this.registered = true;

    logger.info('[NotificationSubscriber] Registering domain event listeners for notifications...');

    // 1. Lead Activity Added
    EventBus.subscribe(LeadEventType.ACTIVITY_ADDED, async (payload: LeadEventPayload) => {
      try {
        const lead = await db.leads.findFirst({
          where: { lead_id: payload.leadId },
          select: {
            org_id: true,
            lead_number: true,
            student_name: true,
            assigned_counsellor_id: true,
            created_by: true,
          },
        });

        if (!lead) return;

        // Determine recipient: notify assigned counselor if logged by someone else, or lead creator
        let recipient: string | null = null;
        if (lead.assigned_counsellor_id && lead.assigned_counsellor_id !== payload.performedBy) {
          recipient = lead.assigned_counsellor_id;
        } else if (lead.created_by && lead.created_by !== payload.performedBy) {
          recipient = lead.created_by;
        } else if (lead.assigned_counsellor_id) {
          recipient = lead.assigned_counsellor_id;
        } else {
          recipient = lead.created_by || payload.performedBy || null;
        }

        if (!recipient) return;

        await NotificationService.sendNotification(lead.org_id, {
          recipient_user_id: recipient,
          category: notification_category.ADMISSION,
          type: 'lead.activity_added',
          priority: notification_priority.NORMAL,
          title: 'Lead Activity Logged',
          message: `New activity logged for lead ${lead.lead_number} (${lead.student_name || 'Candidate'})`,
          entity_type: 'lead',
          entity_id: payload.leadId,
          action_url: `/app/leads`,
          metadata: payload.metadata,
        });
      } catch (err) {
        logger.error(
          '[NotificationSubscriber] Failed to process LeadEventType.ACTIVITY_ADDED:',
          err,
        );
      }
    });

    // 2. Lead Assigned
    EventBus.subscribe(LeadEventType.ASSIGNED, async (payload: LeadEventPayload) => {
      try {
        const counselorId = payload.counselorId || payload.metadata?.assignedTo;
        if (!counselorId) return;

        const lead = await db.leads.findFirst({
          where: { lead_id: payload.leadId },
          select: {
            org_id: true,
            lead_number: true,
            student_name: true,
          },
        });

        if (!lead) return;

        await NotificationService.sendNotification(lead.org_id, {
          recipient_user_id: counselorId,
          category: notification_category.ADMISSION,
          type: 'lead.assigned',
          priority: notification_priority.HIGH,
          title: 'New Lead Assigned',
          message: `Lead ${lead.lead_number} (${lead.student_name || 'Candidate'}) has been assigned to you for counseling.`,
          entity_type: 'lead',
          entity_id: payload.leadId,
          action_url: `/app/leads`,
        });
      } catch (err) {
        logger.error('[NotificationSubscriber] Failed to process LeadEventType.ASSIGNED:', err);
      }
    });

    // 3. Admission Decision Recorded (Single authoritative handler preventing duplicates)
    EventBus.subscribe(
      ApplicationEventType.DECISION_RECORDED,
      async (payload: ApplicationEventPayload) => {
        try {
          const app = await db.admissions_applications.findFirst({
            where: { application_id: payload.applicationId },
            select: {
              org_id: true,
              application_number: true,
              student_name: true,
              created_by: true,
              lead: { select: { assigned_counsellor_id: true } },
            },
          });

          if (!app) return;
          const recipient =
            app.created_by || app.lead?.assigned_counsellor_id || payload.performedBy;
          if (!recipient) return;

          const decisionStatus = payload.metadata?.decisionStatus || 'processed';

          let title = 'Admission Decision Update';
          let message = `Application ${app.application_number} (${app.student_name}) decision has been recorded.`;
          let priority = notification_priority.NORMAL;

          if (decisionStatus === 'approved') {
            title = 'Admission Approved';
            message = `Congratulations! Application ${app.application_number} (${app.student_name}) has been approved for admission.`;
            priority = notification_priority.HIGH;
          } else if (decisionStatus === 'waitlisted') {
            title = 'Application Waitlisted';
            message = `Application ${app.application_number} (${app.student_name}) has been placed on the admissions waitlist.`;
            priority = notification_priority.NORMAL;
          } else if (decisionStatus === 'rejected') {
            title = 'Admission Decision Update';
            message = `Application ${app.application_number} (${app.student_name}) has been updated: admission was not approved.`;
            priority = notification_priority.NORMAL;
          } else if (decisionStatus === 'withdrawn') {
            title = 'Application Withdrawn';
            message = `Application ${app.application_number} has been marked as withdrawn.`;
            priority = notification_priority.LOW;
          }

          await NotificationService.sendNotification(app.org_id, {
            recipient_user_id: recipient,
            category: notification_category.ADMISSION,
            type: 'application.decision_recorded',
            priority,
            title,
            message,
            entity_type: 'admission_application',
            entity_id: payload.applicationId,
            action_url: `/app/admissions/applications/${payload.applicationId}`,
            metadata: payload.metadata,
          });
        } catch (err) {
          logger.error(
            '[NotificationSubscriber] Failed to process ApplicationEventType.DECISION_RECORDED:',
            err,
          );
        }
      },
    );

    // 4. Student Enrolled
    EventBus.subscribe(StudentEventType.ENROLLED, async (payload: StudentEventPayload) => {
      try {
        const student = await db.students.findFirst({
          where: { student_id: payload.studentId },
          select: {
            org_id: true,
            first_name: true,
            last_name: true,
            admission_number: true,
            created_by: true,
          },
        });

        if (!student) return;
        const recipient = student.created_by || payload.performedBy;
        if (!recipient) return;

        await NotificationService.sendNotification(student.org_id, {
          recipient_user_id: recipient,
          category: notification_category.ADMISSION,
          type: 'student.enrolled',
          priority: notification_priority.NORMAL,
          title: 'Student Enrollment Completed',
          message: `Student ${student.first_name} ${student.last_name || ''} enrolled successfully (Admission Number: ${student.admission_number || 'Provisioned'}).`,
          entity_type: 'student',
          entity_id: payload.studentId,
          action_url: `/app/students/${payload.studentId}`,
        });
      } catch (err) {
        logger.error('[NotificationSubscriber] Failed to process StudentEventType.ENROLLED:', err);
      }
    });
  }
}
