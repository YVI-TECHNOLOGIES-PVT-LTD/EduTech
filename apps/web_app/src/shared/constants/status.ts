import { LeadStatus, ApplicationStatus, FeePaymentStatus } from './enums';

export const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }
> = {
  // Lead Statuses
  [LeadStatus.NEW]: { label: 'New Lead', variant: 'info' },
  [LeadStatus.CONTACTED]: { label: 'Contacted', variant: 'neutral' },
  [LeadStatus.COUNSELLING_SCHEDULED]: { label: 'Counselling Scheduled', variant: 'warning' },
  [LeadStatus.CAMPUS_VISIT_SCHEDULED]: { label: 'Campus Visit Scheduled', variant: 'warning' },
  [LeadStatus.CAMPUS_VISITED]: { label: 'Campus Visited', variant: 'info' },
  [LeadStatus.APPLICATION_SUBMITTED]: { label: 'Application Submitted', variant: 'success' },
  [LeadStatus.DROPPED]: { label: 'Dropped', variant: 'danger' },
  [LeadStatus.CONVERTED]: { label: 'Converted', variant: 'success' },

  // Application Statuses
  [ApplicationStatus.DRAFT]: { label: 'Draft', variant: 'neutral' },
  [ApplicationStatus.SUBMITTED]: { label: 'Submitted', variant: 'info' },
  [ApplicationStatus.UNDER_REVIEW]: { label: 'Under Review', variant: 'warning' },
  [ApplicationStatus.DOCUMENT_VERIFIED]: { label: 'Docs Verified', variant: 'info' },
  [ApplicationStatus.ASSESSMENT_PENDING]: { label: 'Assessment Pending', variant: 'warning' },
  [ApplicationStatus.ASSESSMENT_COMPLETED]: { label: 'Assessment Completed', variant: 'info' },
  [ApplicationStatus.APPROVED]: { label: 'Approved', variant: 'success' },
  [ApplicationStatus.REJECTED]: { label: 'Rejected', variant: 'danger' },
  [ApplicationStatus.FEE_PENDING]: { label: 'Fee Pending', variant: 'warning' },
  [ApplicationStatus.FEE_PAID]: { label: 'Fee Paid', variant: 'success' },
  [ApplicationStatus.ENROLLED]: { label: 'Enrolled', variant: 'success' },

  // Fee Statuses
  [FeePaymentStatus.PENDING]: { label: 'Pending', variant: 'warning' },
  [FeePaymentStatus.PARTIAL]: { label: 'Partially Paid', variant: 'warning' },
  [FeePaymentStatus.COMPLETED]: { label: 'Paid in Full', variant: 'success' },
  [FeePaymentStatus.REFUNDED]: { label: 'Refunded', variant: 'neutral' },
  [FeePaymentStatus.FAILED]: { label: 'Payment Failed', variant: 'danger' },
};
