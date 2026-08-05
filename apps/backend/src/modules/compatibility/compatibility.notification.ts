import { supabase } from '../../config/supabase';
import { NotificationService } from '../../workflows/NotificationService';

<<<<<<< HEAD
=======
export interface PipelineNotificationContext {
  counselorUserId?: string;
  parentUserId?: string;
  reason?: string;
  appCode?: string;
}

>>>>>>> 1aa9036f75652ce732d16bb174924a1b72dd0b83
export class AdmissionNotificationService {
  /**
   * Resolves all user IDs associated with a specific role.
   */
  static async getUserIdsByRole(roleName: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('user_id, roles(name)')
      .eq('roles.name', roleName);
<<<<<<< HEAD

=======
>>>>>>> 1aa9036f75652ce732d16bb174924a1b72dd0b83
    if (error || !data) return [];
    return data.map((d: any) => d.user_id).filter(Boolean);
  }

  /**
   * Dispatches notifications to recipient roles based on pipeline events.
   */
  static async notifyPipelineEvent(
    event: string,
    applicationId: string,
<<<<<<< HEAD
    context: Record<string, any> = {},
  ) {
=======
    context: PipelineNotificationContext = {},
  ): Promise<void> {
>>>>>>> 1aa9036f75652ce732d16bb174924a1b72dd0b83
    try {
      switch (event) {
        case 'INQUIRY_CREATED': {
          const recIds = await this.getUserIdsByRole('RECEPTIONIST');
          for (const uid of recIds) {
            await NotificationService.send(
              uid,
              'New Inquiry Created',
              `A new walk-in or online inquiry has been registered.`,
            );
          }
          break;
        }
        case 'LEAD_ASSIGNED': {
          if (context.counselorUserId) {
            await NotificationService.send(
              context.counselorUserId,
              'Lead Assigned',
              `A new candidate lead has been assigned to you for counseling.`,
            );
          }
          break;
        }
        case 'APPLICATION_SUBMITTED': {
          const aoIds = await this.getUserIdsByRole('ADMISSION_OFFICER');
          for (const uid of aoIds) {
            await NotificationService.send(
              uid,
              'Application Submitted',
              `Application ${applicationId} has been submitted and is ready for review.`,
            );
          }
          break;
        }
        case 'DOCUMENT_REJECTED': {
          if (context.parentUserId) {
            await NotificationService.send(
              context.parentUserId,
              'Document Checklist Rejected',
              `Some documents require re-upload: ${context.reason || 'Verification failed'}.`,
            );
          }
          break;
        }
        case 'EXAM_SCHEDULED': {
          if (context.parentUserId) {
            await NotificationService.send(
              context.parentUserId,
              'Entrance Test Scheduled',
              `Your entrance examination has been scheduled.`,
            );
          }
          break;
        }
        case 'MERIT_PUBLISHED': {
          if (context.parentUserId) {
            await NotificationService.send(
              context.parentUserId,
              'Merit List Published',
              `The merit list has been published. Please review your standing.`,
            );
          }
          break;
        }
        case 'OFFER_SENT': {
          if (context.parentUserId) {
            await NotificationService.send(
              context.parentUserId,
              'Admission Offer Extended',
              `Congratulations! An offer of admission has been extended. Please verify details.`,
            );
          }
          break;
        }
        case 'PAYMENT_PENDING': {
          const finIds = await this.getUserIdsByRole('FINANCE_OFFICER');
          for (const uid of finIds) {
            await NotificationService.send(
              uid,
              'Payment Verification Needed',
              `A fee payment receipt has been uploaded and requires reconciliation.`,
            );
          }
          break;
        }
        case 'PAYMENT_VERIFIED': {
          const aoIds = await this.getUserIdsByRole('ADMISSION_OFFICER');
          for (const uid of aoIds) {
            await NotificationService.send(
              uid,
              'Fee Payment Verified',
              `Application ID: ${applicationId} payment is verified. Ready for SIS enrollment.`,
            );
          }
          break;
        }
        case 'ENROLLMENT_COMPLETE': {
          if (context.parentUserId) {
            await NotificationService.send(
              context.parentUserId,
              'Student Enrollment Complete',
              `Enrollment is finalized. Student Code: ${context.appCode || 'Provisioned'}.`,
            );
          }
          break;
        }
      }
    } catch (err) {
      console.error('[Compatibility Notification] Dispatch failed:', err);
    }
  }
}
