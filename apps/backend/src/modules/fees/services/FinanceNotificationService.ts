import { EventBus } from '../../../workflows/event-bus.service';
import { FinanceEventType, FinanceEventPayload } from '../events/finance.events';
import { FinanceTemplateRenderer, STANDARD_FINANCE_TEMPLATES } from './FinanceTemplateRenderer';
import { FinanceRecipientResolver } from './FinanceRecipientResolver';
import { FinanceChannelAdapters, NotificationChannel } from './FinanceChannelAdapters';
import { FinanceNotificationRepository, FinanceNotificationFilter } from '../repositories/FinanceNotificationRepository';
import { ReceivablesRepository } from '../repositories/ReceivablesRepository';
import { toSafeUuid } from './FeeStructureManagerService';
import { logger } from '../../../utils/logger';

export interface SendRemindersOptions {
  reminderType: 'overdue' | 'due_soon';
  gradeId?: string;
  academicYearId?: string;
  minOutstanding?: number;
  channels?: NotificationChannel[];
  dryRun?: boolean;
}

export class FinanceNotificationService {
  /**
   * Publishes a typed Finance event to the system EventBus.
   * This provides non-blocking, reliable decoupling so financial writes complete cleanly
   * before notifications are prepared and dispatched.
   */
  public static async publishEvent(payload: FinanceEventPayload): Promise<void> {
    if (!payload.orgId) {
      throw new Error('Tenant organization ID is required for Finance event publication');
    }
    if (!payload.eventType) {
      throw new Error('Event type is required for Finance event publication');
    }

    // Default correlation ID if omitted
    if (!payload.correlationId) {
      payload.correlationId = `corr_${payload.eventType}_${Date.now()}`;
    }
    if (!payload.timestamp) {
      payload.timestamp = new Date().toISOString();
    }

    await EventBus.publish(payload.eventType, payload);
  }

  /**
   * Authoritative event processor executed when a FinanceEvent is published.
   * Resolves recipients, renders safe templates, and dispatches to channels durably.
   */
  public static async handleEvent(payload: FinanceEventPayload): Promise<{
    processed: boolean;
    recipientCount: number;
    dispatchedCount: number;
  }> {
    const safeOrgId = toSafeUuid(payload.orgId) || payload.orgId;

    try {
      // 1. Resolve recipients based on event nature
      const isStaffEvent = payload.eventType === FinanceEventType.COLLECTION_FOLLOW_UP_REQUIRED ||
                           payload.eventType === FinanceEventType.FINANCE_NOTIFICATION_DELIVERY_FAILED;

      let recipients = isStaffEvent
        ? await FinanceRecipientResolver.resolveFinanceStaff(safeOrgId)
        : (payload.studentId
            ? await FinanceRecipientResolver.resolveStudentRecipients(safeOrgId, payload.studentId)
            : await FinanceRecipientResolver.resolveFinanceStaff(safeOrgId));

      if (recipients.length === 0) {
        logger.warn(`[FinanceNotificationService] No recipients found for event ${payload.eventType}`, {
          orgId: safeOrgId,
          sourceEntityId: payload.sourceEntityId,
        });
        return { processed: true, recipientCount: 0, dispatchedCount: 0 };
      }

      // 2. Render title and message using allowlisted templates
      const templateVars: Record<string, any> = {
        studentName: payload.studentName || 'Student',
        admissionNo: payload.admissionNo || '',
        gradeName: payload.gradeName || '',
        amount: payload.amount,
        outstandingAmount: payload.outstandingAmount,
        daysOverdue: payload.daysOverdue || 0,
        dueDate: payload.dueDate || '',
        orderReference: payload.orderReference || '',
        paymentMethod: payload.paymentMethod || '',
        receiptNumber: payload.receiptNumber || '',
        receiptUrl: payload.receiptUrl || '',
        concessionName: payload.concessionName || '',
        concessionPercentage: payload.concessionPercentage || 0,
        approvedPercentage: payload.approvedPercentage || 0,
        notes: payload.notes || '',
        ...(payload.metadata || {}),
      };

      const rendered = FinanceTemplateRenderer.renderEventNotification(payload.eventType, templateVars);

      let dispatchedCount = 0;

      // 3. Dispatch to each resolved recipient
      for (const recipient of recipients) {
        // Dispatches to In-App channel (durable PostgreSQL record + realtime)
        const inAppResult = await FinanceChannelAdapters.dispatch('in_app', {
          orgId: safeOrgId,
          recipientUserId: recipient.userId,
          title: rendered.title,
          message: rendered.message,
          type: payload.eventType,
          entityType: payload.sourceWorkflow,
          entityId: payload.sourceEntityId,
          actionUrl: payload.receiptUrl || (payload.studentId ? `/app/finance/receivables` : undefined),
          metadata: {
            ...payload.metadata,
            correlationId: payload.correlationId,
            idempotencyKey: payload.idempotencyKey,
            templateKey: rendered.templateKey,
            recipientRole: recipient.role,
            recipientName: recipient.name,
            sourceWorkflow: payload.sourceWorkflow,
            delivery_status: 'delivered',
            channel: 'in_app',
          },
        });

        if (inAppResult.status === 'delivered') {
          dispatchedCount++;
        }

        // Optional external channels (email / sms) if contact exists
        if (recipient.email) {
          await FinanceChannelAdapters.dispatch('email', {
            orgId: safeOrgId,
            recipientUserId: recipient.userId,
            title: rendered.title,
            message: rendered.message,
            type: payload.eventType,
            contactEmail: recipient.email,
          });
        }
      }

      return {
        processed: true,
        recipientCount: recipients.length,
        dispatchedCount,
      };
    } catch (err: any) {
      logger.error(`[FinanceNotificationService] Error handling ${payload.eventType}: ${err.message}`, err);
      return { processed: false, recipientCount: 0, dispatchedCount: 0 };
    }
  }

  /**
   * Explicitly triggered batch reminder workflow (Screen E).
   * Validates balances against authoritative Phase 8 ledger values.
   * Skips zero balances, settled dues, and future installments.
   */
  public static async sendBatchReminders(
    orgId: string,
    performedBy: string,
    options: SendRemindersOptions
  ): Promise<{
    totalEligible: number;
    dispatchedCount: number;
    skippedCount: number;
    previewSummary: any[];
  }> {
    const safeOrgId = toSafeUuid(orgId) || orgId;

    // 1. Query real outstanding obligations from ReceivablesRepository
    const registerResult = await ReceivablesRepository.getReceivablesRegister(safeOrgId, {
      gradeId: options.gradeId,
      academicYearId: options.academicYearId,
      minOutstanding: options.minOutstanding || 1,
      limit: 100,
    });

    const items = registerResult.items || [];
    const eligibleList: any[] = [];
    let skippedCount = 0;

    for (const item of items) {
      // Financial safety rules:
      // Skip settled or 0 outstanding
      if (!item.outstanding_amount || item.outstanding_amount <= 0 || item.receivable_status === 'Settled') {
        skippedCount++;
        continue;
      }
      // If overdue reminder requested, skip not-yet-due items
      if (options.reminderType === 'overdue' && item.days_overdue <= 0) {
        skippedCount++;
        continue;
      }
      // If due_soon reminder requested, skip already-overdue or items due > 7 days out
      if (options.reminderType === 'due_soon' && (item.days_overdue > 0 || item.days_overdue < -7)) {
        skippedCount++;
        continue;
      }

      eligibleList.push(item);
    }

    if (options.dryRun) {
      return {
        totalEligible: eligibleList.length,
        dispatchedCount: 0,
        skippedCount,
        previewSummary: eligibleList.slice(0, 10).map((i) => ({
          studentName: i.student_name,
          admissionNo: i.admission_no,
          outstandingAmount: i.outstanding_amount,
          dueDate: i.due_date,
          daysOverdue: i.days_overdue,
          gradeName: i.grade_name,
        })),
      };
    }

    let dispatchedCount = 0;

    // 2. Send authorized notifications for eligible accounts
    for (const eligible of eligibleList) {
      const eventType = options.reminderType === 'overdue'
        ? FinanceEventType.FEE_OVERDUE
        : FinanceEventType.FEE_DUE_SOON;

      const eventPayload: FinanceEventPayload = {
        eventType,
        orgId: safeOrgId,
        sourceEntityId: eligible.student_charge_due_id,
        sourceWorkflow: 'batch_reminder',
        timestamp: new Date().toISOString(),
        correlationId: `batch_rem_${Date.now()}_${eligible.student_id}`,
        studentId: eligible.student_id,
        studentName: eligible.student_name,
        admissionNo: eligible.admission_no,
        gradeName: eligible.grade_name,
        outstandingAmount: eligible.outstanding_amount,
        amount: eligible.outstanding_amount,
        dueDate: eligible.due_date,
        daysOverdue: eligible.days_overdue,
        performedBy,
      };

      const result = await this.handleEvent(eventPayload);
      if (result.dispatchedCount > 0) {
        dispatchedCount++;
      }
    }

    return {
      totalEligible: eligibleList.length,
      dispatchedCount,
      skippedCount,
      previewSummary: eligibleList.slice(0, 10),
    };
  }

  /**
   * Retries notification delivery for a given notification and channel.
   */
  public static async retryNotification(
    orgId: string,
    notificationId: string,
    channel: NotificationChannel
  ): Promise<{ success: boolean; result: any }> {
    const safeOrgId = toSafeUuid(orgId) || orgId;

    const validChannels: NotificationChannel[] = ['in_app', 'email', 'sms', 'whatsapp'];
    if (!validChannels.includes(channel)) {
      const err: any = new Error(`Unsupported retry channel '${channel}'. Supported: ${validChannels.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const existing = await FinanceNotificationRepository.findById(safeOrgId, notificationId);

    if (!existing) {
      const err: any = new Error('Notification record not found within authorized organization');
      err.statusCode = 404;
      throw err;
    }

    if (existing.metadata?.delivery_status === 'delivered') {
      const err: any = new Error('Notification delivery is already confirmed; redundant retry is blocked');
      err.statusCode = 409;
      throw err;
    }

    const dispatchResult = await FinanceChannelAdapters.dispatch(channel, {
      orgId: safeOrgId,
      recipientUserId: existing.recipient_user_id,
      title: existing.title,
      message: existing.message,
      type: existing.type,
      entityType: existing.entity_type || undefined,
      entityId: existing.entity_id || undefined,
      actionUrl: existing.action_url || undefined,
      metadata: existing.metadata,
    });

    await FinanceNotificationRepository.recordRetry(safeOrgId, notificationId, channel, dispatchResult.status);

    return {
      success: dispatchResult.status !== 'failed',
      result: dispatchResult,
    };
  }

  /**
   * Retrieves summary metrics for Screen A.
   */
  public static async getSummary(orgId: string) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;
    return FinanceNotificationRepository.getNotificationSummary(safeOrgId);
  }

  /**
   * Retrieves paginated notification activity for Screen B.
   */
  public static async getNotifications(orgId: string, filter: FinanceNotificationFilter = {}) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;
    return FinanceNotificationRepository.getFinanceNotifications(safeOrgId, filter);
  }

  /**
   * Retrieves single notification detail for Screen F.
   */
  public static async getNotificationDetail(orgId: string, id: string) {
    if (!orgId) throw new Error('Tenant organization ID is required');
    const safeOrgId = toSafeUuid(orgId) || orgId;
    const notif = await FinanceNotificationRepository.findById(safeOrgId, id);
    if (!notif) {
      const err: any = new Error('Notification not found');
      err.statusCode = 404;
      throw err;
    }
    return notif;
  }

  /**
   * Returns list of supported Finance templates for Screen C.
   */
  public static getTemplates() {
    return Object.values(STANDARD_FINANCE_TEMPLATES);
  }

  /**
   * Returns channel health probe results for Screen D.
   */
  public static getChannelHealth(orgId?: string) {
    return FinanceChannelAdapters.getChannelHealth(orgId);
  }

  /**
   * Generates sample preview for Screen C.
   */
  public static previewTemplate(templateKey: string, customVars?: Record<string, any>) {
    return FinanceTemplateRenderer.previewTemplate(templateKey, customVars);
  }
}
