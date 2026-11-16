export enum FinanceEventType {
  FEE_ASSESSMENT_CREATED = 'fee.assessment.created',
  FEE_DUE_SOON = 'fee.due.soon',
  FEE_OVERDUE = 'fee.overdue',
  PAYMENT_INITIATED = 'fee.payment.initiated',
  PAYMENT_SUCCESS = 'fee.payment.success',
  PAYMENT_FAILED = 'fee.payment.failed',
  PAYMENT_RECEIPT_AVAILABLE = 'fee.payment.receipt_available',
  CONCESSION_SUBMITTED = 'fee.concession.submitted',
  CONCESSION_APPROVED = 'fee.concession.approved',
  CONCESSION_REJECTED = 'fee.concession.rejected',
  CONCESSION_APPLIED = 'fee.concession.applied',
  COLLECTION_FOLLOW_UP_REQUIRED = 'fee.collection.follow_up_required',
  FINANCE_NOTIFICATION_DELIVERY_FAILED = 'fee.notification.delivery_failed',
}

export interface FinanceEventPayload {
  eventType: FinanceEventType;
  orgId: string;
  sourceEntityId: string;
  sourceWorkflow: string;
  timestamp: string;
  correlationId: string;
  idempotencyKey?: string;
  studentId?: string;
  studentName?: string;
  admissionNo?: string;
  gradeName?: string;
  feeDescription?: string;
  amount?: number;
  outstandingAmount?: number;
  daysOverdue?: number;
  dueDate?: string;
  orderReference?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  receiptUrl?: string;
  concessionName?: string;
  concessionPercentage?: number;
  approvedPercentage?: number;
  notes?: string;
  performedBy?: string;
  metadata?: Record<string, any>;
}
