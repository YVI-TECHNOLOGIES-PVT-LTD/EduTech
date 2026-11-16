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
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (val?: string | null): val is string => !!val && UUID_REGEX.test(val);

export class NotificationSubscriber {
  private static registered = false;

  private static async resolveApplicationRecipient(
    app: {
      org_id: string;
      created_by?: string | null;
      leads?: {
        created_by?: string | null;
        contact_email?: string | null;
        parents?: { user_id?: string | null } | null;
        staff?: { user_id?: string | null } | null;
      } | null;
    },
    performedBy?: string | null,
  ): Promise<string | null> {
    // 1. Direct application creator (Parent / Applicant User)
    if (isUuid(app.created_by)) return app.created_by;

    // 2. Parent account linked to the lead
    if (isUuid(app.leads?.parents?.user_id)) return app.leads.parents.user_id;

    // 3. Lead creator user
    if (isUuid(app.leads?.created_by)) return app.leads.created_by;

    // 4. Match lead contact email to user in the same org
    if (app.leads?.contact_email) {
      try {
        const matched = await db.users.findFirst({
          where: { email: app.leads.contact_email, org_id: app.org_id },
          select: { user_id: true, id: true },
        });
        const matchedId = matched?.user_id || matched?.id;
        if (isUuid(matchedId)) {
          return matchedId;
        }
      } catch {
        // Continue to fallback
      }
    }

    // 5. Assigned counselor staff user
    if (isUuid(app.leads?.staff?.user_id)) return app.leads.staff.user_id;

    // 6. Action performer (if valid user UUID)
    if (isUuid(performedBy)) return performedBy;

    // 7. Organization fallback: any active staff/admin user in org
    try {
      const orgStaff = await db.users.findFirst({
        where: { org_id: app.org_id, status: 'active' },
        select: { user_id: true, id: true },
      });
      const staffUserId = orgStaff?.user_id || orgStaff?.id;
      if (isUuid(staffUserId)) {
        return staffUserId;
      }
    } catch {
      // Continue
    }

    return null;
  }

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
            student_first_name: true,
            student_last_name: true,
            assigned_counsellor_id: true,
            created_by: true,
            parents: { select: { user_id: true } },
            staff: { select: { user_id: true } },
          },
        });

        if (!lead) {
          logger.warn(
            `[NotificationSubscriber] Lead not found for ACTIVITY_ADDED: ${payload.leadId}`,
          );
          return;
        }

        const studentFullName =
          `${lead.student_first_name || ''} ${lead.student_last_name || ''}`.trim() || 'Candidate';
        const counselorUserId = lead.staff?.user_id;

        // Determine recipient: notify assigned counselor, lead creator, parent, or actor
        let recipient: string | null = null;
        if (counselorUserId && counselorUserId !== payload.performedBy) {
          recipient = counselorUserId;
        } else if (lead.created_by && lead.created_by !== payload.performedBy) {
          recipient = lead.created_by;
        } else if (lead.parents?.user_id) {
          recipient = lead.parents.user_id;
        } else if (counselorUserId) {
          recipient = counselorUserId;
        } else {
          recipient = lead.created_by || payload.performedBy || null;
        }

        if (!recipient) {
          const fallback = await db.users.findFirst({
            where: { org_id: lead.org_id, status: 'active' },
            select: { user_id: true, id: true },
          });
          recipient = fallback?.user_id || fallback?.id || null;
        }

        if (!recipient) {
          logger.warn(
            `[NotificationSubscriber] No recipient resolved for ACTIVITY_ADDED: ${payload.leadId}`,
          );
          return;
        }

        await NotificationService.sendNotification(lead.org_id, {
          recipient_user_id: recipient,
          category: notification_category.ADMISSION,
          type: 'lead.activity_added',
          priority: notification_priority.NORMAL,
          title: 'Lead Activity Logged',
          message: `New activity logged for lead ${lead.lead_number} (${studentFullName})`,
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
            student_first_name: true,
            student_last_name: true,
            staff: { select: { user_id: true } },
          },
        });

        if (!lead) {
          logger.warn(`[NotificationSubscriber] Lead not found for ASSIGNED: ${payload.leadId}`);
          return;
        }

        // Map counselor staff ID to user_id if needed
        let recipientUserId = lead.staff?.user_id || counselorId;
        const staffMember = await db.staff.findFirst({
          where: { staff_id: recipientUserId },
          select: { user_id: true },
        });
        if (staffMember?.user_id) {
          recipientUserId = staffMember.user_id;
        }

        if (!recipientUserId) return;

        const studentFullName =
          `${lead.student_first_name || ''} ${lead.student_last_name || ''}`.trim() || 'Candidate';

        await NotificationService.sendNotification(lead.org_id, {
          recipient_user_id: recipientUserId,
          category: notification_category.ADMISSION,
          type: 'lead.assigned',
          priority: notification_priority.HIGH,
          title: 'New Lead Assigned',
          message: `Lead ${lead.lead_number} (${studentFullName}) has been assigned to you for counseling.`,
          entity_type: 'lead',
          entity_id: payload.leadId,
          action_url: `/app/leads`,
        });
      } catch (err) {
        logger.error('[NotificationSubscriber] Failed to process LeadEventType.ASSIGNED:', err);
      }
    });

    // 3. Admission Decision Recorded (Single authoritative handler)
    EventBus.subscribe(
      ApplicationEventType.DECISION_RECORDED,
      async (payload: ApplicationEventPayload) => {
        try {
          const app = await db.admissions_applications.findFirst({
            where: { application_id: payload.applicationId },
            select: {
              org_id: true,
              application_number: true,
              created_by: true,
              leads: {
                select: {
                  student_first_name: true,
                  student_last_name: true,
                  contact_email: true,
                  created_by: true,
                  parents: { select: { user_id: true } },
                  staff: { select: { user_id: true } },
                },
              },
            },
          });

          if (!app) {
            logger.warn(
              `[NotificationSubscriber] Application not found for DECISION_RECORDED: ${payload.applicationId}`,
            );
            return;
          }

          const recipient = await NotificationSubscriber.resolveApplicationRecipient(
            app,
            payload.performedBy,
          );

          if (!recipient) {
            logger.warn(
              `[NotificationSubscriber] No recipient resolved for DECISION_RECORDED: ${payload.applicationId}`,
            );
            return;
          }

          const studentFullName =
            `${app.leads?.student_first_name || ''} ${app.leads?.student_last_name || ''}`.trim() ||
            'Applicant';
          const decisionStatus = payload.metadata?.decisionStatus || 'processed';

          let title = 'Admission Decision Update';
          let message = `Application ${app.application_number} (${studentFullName}) decision has been recorded.`;
          let priority = notification_priority.NORMAL;

          if (decisionStatus === 'approved') {
            title = 'Admission Approved';
            message = `Congratulations! Application ${app.application_number} (${studentFullName}) has been approved for admission.`;
            priority = notification_priority.HIGH;
          } else if (decisionStatus === 'waitlisted') {
            title = 'Application Waitlisted';
            message = `Application ${app.application_number} (${studentFullName}) has been placed on the admissions waitlist.`;
            priority = notification_priority.NORMAL;
          } else if (decisionStatus === 'rejected') {
            title = 'Admission Decision Update';
            message = `Application ${app.application_number} (${studentFullName}) has been updated: admission was not approved.`;
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
            admission_no: true,
            user_id: true,
            created_by: true,
          },
        });

        if (!student) {
          logger.warn(
            `[NotificationSubscriber] Student not found for ENROLLED: ${payload.studentId}`,
          );
          return;
        }

        let recipient = student.user_id || student.created_by || payload.performedBy;
        if (!recipient) {
          const fallback = await db.users.findFirst({
            where: { org_id: student.org_id, status: 'active' },
            select: { user_id: true, id: true },
          });
          recipient = fallback?.user_id || fallback?.id || null;
        }

        if (!recipient) {
          logger.warn(
            `[NotificationSubscriber] No recipient resolved for ENROLLED: ${payload.studentId}`,
          );
          return;
        }

        const fullName =
          `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student';

        await NotificationService.sendNotification(student.org_id, {
          recipient_user_id: recipient,
          category: notification_category.ADMISSION,
          type: 'student.enrolled',
          priority: notification_priority.NORMAL,
          title: 'Student Enrollment Completed',
          message: `Student ${fullName} enrolled successfully (Admission Number: ${student.admission_no || 'Provisioned'}).`,
          entity_type: 'student',
          entity_id: payload.studentId,
          action_url: `/app/students/${payload.studentId}`,
        });
      } catch (err) {
        logger.error('[NotificationSubscriber] Failed to process StudentEventType.ENROLLED:', err);
      }
    });

    // 5. Admission Payment Recorded
    EventBus.subscribe(
      ApplicationEventType.PAYMENT_RECORDED,
      async (payload: ApplicationEventPayload) => {
        try {
          const app = await db.admissions_applications.findFirst({
            where: { application_id: payload.applicationId },
            select: {
              org_id: true,
              application_number: true,
              created_by: true,
              leads: {
                select: {
                  student_first_name: true,
                  student_last_name: true,
                  contact_email: true,
                  created_by: true,
                  parents: { select: { user_id: true } },
                  staff: { select: { user_id: true } },
                },
              },
            },
          });

          if (!app) return;

          const recipient = await NotificationSubscriber.resolveApplicationRecipient(
            app,
            payload.performedBy,
          );
          if (!recipient) return;

          const studentFullName =
            `${app.leads?.student_first_name || ''} ${app.leads?.student_last_name || ''}`.trim() ||
            'Applicant';
          const amount = payload.metadata?.amount ? `₹${payload.metadata.amount}` : 'Fee payment';

          await NotificationService.sendNotification(app.org_id, {
            recipient_user_id: recipient,
            category: notification_category.ADMISSION,
            type: 'application.payment_recorded',
            priority: notification_priority.NORMAL,
            title: 'Fee Payment Received',
            message: `${amount} for application ${app.application_number} (${studentFullName}) was received successfully.`,
            entity_type: 'admission_application',
            entity_id: payload.applicationId,
            action_url: `/app/admissions/applications/${payload.applicationId}`,
            metadata: payload.metadata,
          });
        } catch (err) {
          logger.error(
            '[NotificationSubscriber] Failed to process ApplicationEventType.PAYMENT_RECORDED:',
            err,
          );
        }
      },
    );

    // 6. Admission Document Verified
    EventBus.subscribe(
      ApplicationEventType.DOCUMENT_VERIFIED,
      async (payload: ApplicationEventPayload) => {
        try {
          const app = await db.admissions_applications.findFirst({
            where: { application_id: payload.applicationId },
            select: {
              org_id: true,
              application_number: true,
              created_by: true,
              leads: {
                select: {
                  student_first_name: true,
                  student_last_name: true,
                  contact_email: true,
                  created_by: true,
                  parents: { select: { user_id: true } },
                },
              },
            },
          });

          if (!app) return;

          const recipient = await NotificationSubscriber.resolveApplicationRecipient(
            app,
            payload.performedBy,
          );
          if (!recipient) return;

          const studentFullName =
            `${app.leads?.student_first_name || ''} ${app.leads?.student_last_name || ''}`.trim() ||
            'Applicant';
          const status = payload.metadata?.verifyStatus || 'verified';

          await NotificationService.sendNotification(app.org_id, {
            recipient_user_id: recipient,
            category: notification_category.ADMISSION,
            type: 'application.document_verified',
            priority:
              status === 'rejected' ? notification_priority.HIGH : notification_priority.NORMAL,
            title: status === 'rejected' ? 'Document Verification Failed' : 'Document Verified',
            message:
              status === 'rejected'
                ? `A document for application ${app.application_number} (${studentFullName}) was rejected. Please review remarks and re-upload.`
                : `Documents for application ${app.application_number} (${studentFullName}) have been verified successfully.`,
            entity_type: 'admission_application',
            entity_id: payload.applicationId,
            action_url: `/app/admissions/applications/${payload.applicationId}`,
            metadata: payload.metadata,
          });
        } catch (err) {
          logger.error(
            '[NotificationSubscriber] Failed to process ApplicationEventType.DOCUMENT_VERIFIED:',
            err,
          );
        }
      },
    );

    // 7. Admission Application Status Changed (Lifecycle Transitions)
    EventBus.subscribe(
      ApplicationEventType.STATUS_CHANGED,
      async (payload: ApplicationEventPayload) => {
        try {
          const app = await db.admissions_applications.findFirst({
            where: { application_id: payload.applicationId },
            select: {
              org_id: true,
              application_number: true,
              created_by: true,
              leads: {
                select: {
                  student_first_name: true,
                  student_last_name: true,
                  contact_email: true,
                  created_by: true,
                  parents: { select: { user_id: true } },
                  staff: { select: { user_id: true } },
                },
              },
            },
          });

          if (!app) {
            logger.warn(
              `[NotificationSubscriber] Application not found for STATUS_CHANGED: ${payload.applicationId}`,
            );
            return;
          }

          const recipient = await NotificationSubscriber.resolveApplicationRecipient(
            app,
            payload.performedBy,
          );

          if (!recipient) {
            logger.warn(
              `[NotificationSubscriber] No recipient resolved for STATUS_CHANGED: ${payload.applicationId}`,
            );
            return;
          }

          const studentFullName =
            `${app.leads?.student_first_name || ''} ${app.leads?.student_last_name || ''}`.trim() ||
            'Applicant';

          let title = 'Application Status Updated';
          let message = `Application ${app.application_number} (${studentFullName}) status has been updated to ${payload.newStatus || 'under review'}.`;
          let priority = notification_priority.NORMAL;

          if (payload.newStatus === 'under_review') {
            title = 'Application Under Review';
            message = `Your admission application ${app.application_number} (${studentFullName}) is now under review by the admissions team.`;
            priority = notification_priority.NORMAL;
          } else if (payload.newStatus === 'documents_pending') {
            title = 'Documents Required';
            message = `Additional documents are required for application ${app.application_number} (${studentFullName}).`;
            priority = notification_priority.HIGH;
          } else if (payload.newStatus === 'assessment_pending') {
            title = 'Assessment Pending';
            message = `Assessment is now scheduled/pending for application ${app.application_number} (${studentFullName}).`;
            priority = notification_priority.NORMAL;
          } else if (payload.newStatus === 'submitted') {
            title = 'Application Submitted';
            message = `Application ${app.application_number} (${studentFullName}) has been submitted successfully.`;
            priority = notification_priority.NORMAL;
          } else if (payload.newStatus === 'approved') {
            title = 'Admission Approved';
            message = `Congratulations! Application ${app.application_number} (${studentFullName}) has been approved.`;
            priority = notification_priority.HIGH;
          } else if (payload.newStatus === 'waitlisted') {
            title = 'Application Waitlisted';
            message = `Application ${app.application_number} (${studentFullName}) has been placed on the admissions waitlist.`;
            priority = notification_priority.NORMAL;
          } else if (payload.newStatus === 'rejected') {
            title = 'Admission Decision Update';
            message = `Application ${app.application_number} (${studentFullName}) has been updated: admission was not approved.`;
            priority = notification_priority.NORMAL;
          } else if (payload.newStatus === 'withdrawn') {
            title = 'Application Withdrawn';
            message = `Application ${app.application_number} has been marked as withdrawn.`;
            priority = notification_priority.LOW;
          }

          await NotificationService.sendNotification(app.org_id, {
            recipient_user_id: recipient,
            category: notification_category.ADMISSION,
            type: 'application.status_changed',
            priority,
            title,
            message,
            entity_type: 'admission_application',
            entity_id: payload.applicationId,
            action_url: `/app/admissions/applications/${payload.applicationId}`,
            metadata: {
              previousStatus: payload.previousStatus,
              newStatus: payload.newStatus,
            },
          });
        } catch (err) {
          logger.error(
            '[NotificationSubscriber] Failed to process ApplicationEventType.STATUS_CHANGED:',
            err,
          );
        }
      },
    );
  }
}
