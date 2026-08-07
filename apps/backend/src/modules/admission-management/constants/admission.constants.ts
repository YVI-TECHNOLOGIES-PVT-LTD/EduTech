/**
 * Admission Application Management Constants (Stage-1)
 * Re-exports native Prisma Client enums directly.
 */

import * as PrismaClientPkg from '@prisma/client';

export const application_status = (PrismaClientPkg as any).application_status || {
  submitted: 'submitted',
  documents_pending: 'documents_pending',
  assessment_pending: 'assessment_pending',
  under_review: 'under_review',
  approved: 'approved',
  waitlisted: 'waitlisted',
  rejected: 'rejected',
  withdrawn: 'withdrawn',
};

export const document_verify_status = (PrismaClientPkg as any).document_verify_status || {
  pending: 'pending',
  verified: 'verified',
  rejected: 'rejected',
  resubmission_requested: 'resubmission_requested',
};

export const assessment_result = (PrismaClientPkg as any).assessment_result || {
  pass: 'pass',
  fail: 'fail',
  recommended: 'recommended',
  not_recommended: 'not_recommended',
};

export const assessment_mode = (PrismaClientPkg as any).assessment_mode || {
  written: 'written',
  online: 'online',
  oral: 'oral',
  observation: 'observation',
  practical: 'practical',
};

export const assessment_result_type = (PrismaClientPkg as any).assessment_result_type || {
  marks: 'marks',
  pass_fail: 'pass_fail',
  recommendation: 'recommendation',
};

export const admission_decision_status = (PrismaClientPkg as any).admission_decision_status || {
  approved: 'approved',
  waitlisted: 'waitlisted',
  rejected: 'rejected',
  withdrawn: 'withdrawn',
};

export const admission_payment_status = (PrismaClientPkg as any).admission_payment_status || {
  pending: 'pending',
  partial: 'partial',
  paid: 'paid',
  failed: 'failed',
  waived: 'waived',
  refunded: 'refunded',
};

export type application_status = keyof typeof application_status;
export type document_verify_status = keyof typeof document_verify_status;
export type assessment_result = keyof typeof assessment_result;
export type admission_decision_status = keyof typeof admission_decision_status;
export type admission_payment_status = keyof typeof admission_payment_status;

// Aliases for convenience
export { application_status as ApplicationStatus };
export { document_verify_status as DocumentVerifyStatus };
export { assessment_result as AssessmentResult };
export { admission_decision_status as DecisionStatus };
export { admission_payment_status as PaymentStatus };

export const ALLOWED_APPLICATION_STATUS_TRANSITIONS: Record<string, string[]> = {
  [application_status.submitted]: [
    application_status.documents_pending,
    application_status.assessment_pending,
    application_status.under_review,
    application_status.rejected,
    application_status.withdrawn,
  ],
  [application_status.documents_pending]: [
    application_status.assessment_pending,
    application_status.under_review,
    application_status.rejected,
    application_status.withdrawn,
  ],
  [application_status.assessment_pending]: [
    application_status.under_review,
    application_status.approved,
    application_status.waitlisted,
    application_status.rejected,
    application_status.withdrawn,
  ],
  [application_status.under_review]: [
    application_status.approved,
    application_status.waitlisted,
    application_status.rejected,
    application_status.withdrawn,
  ],
  [application_status.approved]: [
    application_status.withdrawn,
  ],
  [application_status.waitlisted]: [
    application_status.approved,
    application_status.rejected,
    application_status.withdrawn,
  ],
  [application_status.rejected]: [
    application_status.submitted, // Re-opening
  ],
  [application_status.withdrawn]: [],
};
