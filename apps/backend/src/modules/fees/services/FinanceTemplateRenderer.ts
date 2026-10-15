import { FinanceEventType } from '../events/finance.events';

export interface FinanceTemplateDefinition {
  key: string;
  eventType: FinanceEventType;
  titleTemplate: string;
  bodyTemplate: string;
  supportedChannels: Array<'in_app' | 'email' | 'sms' | 'whatsapp'>;
  description: string;
}

export const ALLOWED_TEMPLATE_VARIABLES = new Set([
  'studentName',
  'admissionNo',
  'gradeName',
  'academicYear',
  'feeDescription',
  'dueDate',
  'amount',
  'outstandingAmount',
  'daysOverdue',
  'paymentStatus',
  'paymentMethod',
  'orderReference',
  'receiptNumber',
  'receiptUrl',
  'institutionName',
  'concessionName',
  'concessionPercentage',
  'approvedPercentage',
  'notes',
]);

export const STANDARD_FINANCE_TEMPLATES: Record<FinanceEventType, FinanceTemplateDefinition> = {
  [FinanceEventType.FEE_ASSESSMENT_CREATED]: {
    key: 'fee_assessment_created',
    eventType: FinanceEventType.FEE_ASSESSMENT_CREATED,
    titleTemplate: 'New Fee Assessment: {{studentName}}',
    bodyTemplate: 'A new fee assessment of {{amount}} has been posted for {{studentName}} ({{admissionNo}}). Due date: {{dueDate}}.',
    supportedChannels: ['in_app', 'email', 'sms'],
    description: 'Triggered when a new fee assessment or charge demand is posted to a student ledger.',
  },
  [FinanceEventType.FEE_DUE_SOON]: {
    key: 'fee_due_soon',
    eventType: FinanceEventType.FEE_DUE_SOON,
    titleTemplate: 'Upcoming Fee Due: {{studentName}}',
    bodyTemplate: 'Fee obligation of {{amount}} for {{studentName}} ({{admissionNo}}) is due on {{dueDate}}. Please settle prior to the deadline.',
    supportedChannels: ['in_app', 'email', 'sms', 'whatsapp'],
    description: 'Sent 3–7 days before an upcoming fee installment due date.',
  },
  [FinanceEventType.FEE_OVERDUE]: {
    key: 'fee_overdue',
    eventType: FinanceEventType.FEE_OVERDUE,
    titleTemplate: 'Overdue Fee Notice: {{studentName}}',
    bodyTemplate: 'Outstanding fee obligation of {{outstandingAmount}} for {{studentName}} ({{admissionNo}}) is past due ({{daysOverdue}} days overdue). Please clear the dues promptly.',
    supportedChannels: ['in_app', 'email', 'sms', 'whatsapp'],
    description: 'Sent when an active fee due date has passed with an unpaid balance.',
  },
  [FinanceEventType.PAYMENT_INITIATED]: {
    key: 'payment_initiated',
    eventType: FinanceEventType.PAYMENT_INITIATED,
    titleTemplate: 'Payment Order Initiated: {{orderReference}}',
    bodyTemplate: 'A payment attempt of {{amount}} for {{studentName}} has been initiated (Reference: {{orderReference}}). Status: Pending.',
    supportedChannels: ['in_app', 'email'],
    description: 'Notice confirming payment checkout initiation (never reported as successful until verified).',
  },
  [FinanceEventType.PAYMENT_SUCCESS]: {
    key: 'payment_success',
    eventType: FinanceEventType.PAYMENT_SUCCESS,
    titleTemplate: 'Payment Confirmed: ₹{{amount}} Received',
    bodyTemplate: 'Payment of {{amount}} for {{studentName}} ({{admissionNo}}) was successfully confirmed (Order: {{orderReference}}). Thank you.',
    supportedChannels: ['in_app', 'email', 'sms', 'whatsapp'],
    description: 'Emitted only after payment is durably verified and committed in PostgreSQL.',
  },
  [FinanceEventType.PAYMENT_FAILED]: {
    key: 'payment_failed',
    eventType: FinanceEventType.PAYMENT_FAILED,
    titleTemplate: 'Payment Incomplete: Order {{orderReference}}',
    bodyTemplate: 'The payment attempt of {{amount}} for {{studentName}} could not be completed. You may retry or contact the school finance desk.',
    supportedChannels: ['in_app', 'email'],
    description: 'Emitted when a payment transaction is confirmed failed by gateway or cashier.',
  },
  [FinanceEventType.PAYMENT_RECEIPT_AVAILABLE]: {
    key: 'payment_receipt_available',
    eventType: FinanceEventType.PAYMENT_RECEIPT_AVAILABLE,
    titleTemplate: 'Receipt Available: Receipt #{{receiptNumber}}',
    bodyTemplate: 'Payment receipt #{{receiptNumber}} for {{studentName}} is ready. You can view or download it from the finance portal.',
    supportedChannels: ['in_app', 'email'],
    description: 'Sent once an official verified payment receipt document is generated.',
  },
  [FinanceEventType.CONCESSION_SUBMITTED]: {
    key: 'concession_submitted',
    eventType: FinanceEventType.CONCESSION_SUBMITTED,
    titleTemplate: 'Scholarship/Concession Recommended: {{studentName}}',
    bodyTemplate: 'A scholarship recommendation of {{concessionPercentage}}% ({{concessionName}}) has been submitted for {{studentName}}.',
    supportedChannels: ['in_app', 'email'],
    description: 'Emitted when a scholarship or fee waiver application is recommended.',
  },
  [FinanceEventType.CONCESSION_APPROVED]: {
    key: 'concession_approved',
    eventType: FinanceEventType.CONCESSION_APPROVED,
    titleTemplate: 'Scholarship/Concession Approved: {{studentName}}',
    bodyTemplate: 'Scholarship award {{concessionName}} ({{approvedPercentage}}%) for {{studentName}} has been approved by the institution authority.',
    supportedChannels: ['in_app', 'email'],
    description: 'Emitted when an authorized officer approves a scholarship award.',
  },
  [FinanceEventType.CONCESSION_REJECTED]: {
    key: 'concession_rejected',
    eventType: FinanceEventType.CONCESSION_REJECTED,
    titleTemplate: 'Scholarship/Concession Decision: {{studentName}}',
    bodyTemplate: 'The scholarship request {{concessionName}} for {{studentName}} was not approved. Remarks: {{notes}}.',
    supportedChannels: ['in_app', 'email'],
    description: 'Emitted when a concession recommendation is rejected.',
  },
  [FinanceEventType.CONCESSION_APPLIED]: {
    key: 'concession_applied',
    eventType: FinanceEventType.CONCESSION_APPLIED,
    titleTemplate: 'Concession Applied to Ledger: {{studentName}}',
    bodyTemplate: 'Approved scholarship {{concessionName}} has been applied to dues for {{studentName}}. Ledger balances have been adjusted.',
    supportedChannels: ['in_app', 'email'],
    description: 'Emitted when an approved concession is applied directly to dues.',
  },
  [FinanceEventType.COLLECTION_FOLLOW_UP_REQUIRED]: {
    key: 'collection_follow_up_required',
    eventType: FinanceEventType.COLLECTION_FOLLOW_UP_REQUIRED,
    titleTemplate: 'Collection Follow-Up Required: {{studentName}}',
    bodyTemplate: 'Account {{admissionNo}} ({{studentName}}, {{gradeName}}) has an overdue balance of {{outstandingAmount}} requiring staff follow-up.',
    supportedChannels: ['in_app'],
    description: 'Internal notification alerting finance staff to high-risk overdue accounts.',
  },
  [FinanceEventType.FINANCE_NOTIFICATION_DELIVERY_FAILED]: {
    key: 'finance_notification_delivery_failed',
    eventType: FinanceEventType.FINANCE_NOTIFICATION_DELIVERY_FAILED,
    titleTemplate: 'Notification Dispatch Warning: {{studentName}}',
    bodyTemplate: 'External notification dispatch for {{studentName}} encountered an issue: {{notes}}.',
    supportedChannels: ['in_app'],
    description: 'Alerts finance administrators when an external SMS or Email provider rejects dispatch.',
  },
};

export class FinanceTemplateRenderer {
  /**
   * Escape HTML entities to prevent XSS in customer messages.
   */
  public static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Format numbers to localized currency (INR default).
   */
  public static formatMoney(amount: number | string | undefined): string {
    const val = Number(amount);
    if (isNaN(val)) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  }

  /**
   * Format dates to localized date display.
   */
  public static formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * Validates that all placeholder variables in template text are allowlisted.
   */
  public static validateTemplateVariables(templateText: string): {
    isValid: boolean;
    invalidVariables: string[];
  } {
    const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    let match;
    const invalidVariables: string[] = [];

    while ((match = regex.exec(templateText)) !== null) {
      const varName = match[1];
      if (!ALLOWED_TEMPLATE_VARIABLES.has(varName)) {
        invalidVariables.push(varName);
      }
    }

    return {
      isValid: invalidVariables.length === 0,
      invalidVariables,
    };
  }

  /**
   * Renders a template string by interpolating allowlisted variables with safe escaping.
   */
  public static renderString(
    templateStr: string,
    variables: Record<string, any> = {}
  ): string {
    return templateStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, varName) => {
      if (!ALLOWED_TEMPLATE_VARIABLES.has(varName)) {
        return `[UNKNOWN_VAR: ${varName}]`;
      }
      const rawVal = variables[varName];
      if (rawVal === undefined || rawVal === null) {
        return '';
      }
      // If variable is an amount, format as currency
      if (varName === 'amount' || varName === 'outstandingAmount') {
        return this.formatMoney(rawVal);
      }
      if (varName === 'dueDate' && typeof rawVal === 'string' && rawVal.length > 0) {
        return this.escapeHtml(this.formatDate(rawVal));
      }
      return this.escapeHtml(String(rawVal));
    });
  }

  /**
   * Renders title and message for a specific finance event.
   */
  public static renderEventNotification(
    eventType: FinanceEventType,
    variables: Record<string, any>
  ): { title: string; message: string; templateKey: string } {
    const templateDef = STANDARD_FINANCE_TEMPLATES[eventType];
    if (!templateDef) {
      return {
        title: `Finance Update: ${eventType}`,
        message: `Finance event recorded for student ${variables.studentName || 'account'}.`,
        templateKey: 'default_fallback',
      };
    }

    const title = this.renderString(templateDef.titleTemplate, variables);
    const message = this.renderString(templateDef.bodyTemplate, variables);

    return {
      title,
      message,
      templateKey: templateDef.key,
    };
  }

  /**
   * Generates a preview with mock sample data for a given template.
   */
  public static previewTemplate(
    templateKey: string,
    customVariables?: Record<string, any>
  ): { title: string; message: string; variablesUsed: Record<string, any> } {
    // Find matching definition by key or eventType (flexible normalization)
    const normalizedTarget = templateKey.toLowerCase().replace(/[\._]/g, '');
    const def = Object.values(STANDARD_FINANCE_TEMPLATES).find((t) => {
      const kNorm = t.key.toLowerCase().replace(/[\._]/g, '');
      const eNorm = t.eventType.toLowerCase().replace(/[\._]/g, '');
      return kNorm === normalizedTarget || eNorm === normalizedTarget;
    });
    const sampleData: Record<string, any> = {
      studentName: 'Aarav Sharma',
      admissionNo: 'ADM-2026-0042',
      gradeName: 'Grade 10',
      academicYear: '2026-2027',
      feeDescription: 'Term 1 Tuition Fee',
      dueDate: '2026-11-15',
      amount: 15000,
      outstandingAmount: 8500,
      daysOverdue: 14,
      paymentStatus: 'success',
      paymentMethod: 'UPI',
      orderReference: 'ORD-2026-9812',
      receiptNumber: 'RCP-2026-0019',
      receiptUrl: '/app/finance/receipts/view/RCP-2026-0019',
      institutionName: 'EduTrack Global Academy',
      concessionName: 'Merit Excellence Award',
      concessionPercentage: 25,
      approvedPercentage: 25,
      notes: 'Approved by Principal',
      ...customVariables,
    };

    if (!def) {
      throw new Error(`Template not found for key: ${templateKey}`);
    }

    const title = this.renderString(def.titleTemplate, sampleData);
    const message = this.renderString(def.bodyTemplate, sampleData);

    return {
      title,
      message,
      variablesUsed: sampleData,
    };
  }
}
