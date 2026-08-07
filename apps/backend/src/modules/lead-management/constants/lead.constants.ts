/**
 * Lead Management Constants (Stage-1)
 * Aligned with the finalized PostgreSQL / Prisma schema.
 */

import * as PrismaClientPkg from '@prisma/client';

export const lead_stage = (PrismaClientPkg as any).lead_stage || {
  enquiry_received: 'enquiry_received',
  qualified: 'qualified',
  counselling_scheduled: 'counselling_scheduled',
  campus_visit: 'campus_visit',
  application_submitted: 'application_submitted',
  document_verification: 'document_verification',
  assessment: 'assessment',
  admission_approved: 'admission_approved',
  waitlisted: 'waitlisted',
  rejected: 'rejected',
  fee_payment_pending: 'fee_payment_pending',
  enrolled: 'enrolled',
};

export const lead_source = (PrismaClientPkg as any).lead_source || {
  website: 'website',
  walk_in: 'walk_in',
  referral: 'referral',
  social_media: 'social_media',
  chatbot: 'chatbot',
  qr_code: 'qr_code',
  education_fair: 'education_fair',
  phone_call: 'phone_call',
  email: 'email',
  other: 'other',
};

export const lead_activity_type = (PrismaClientPkg as any).lead_activity_type || {
  phone_call: 'phone_call',
  email: 'email',
  whatsapp: 'whatsapp',
  chatbot: 'chatbot',
  follow_up: 'follow_up',
  counselling: 'counselling',
  application_submitted: 'application_submitted',
  note: 'note',
};

export const activity_status = (PrismaClientPkg as any).activity_status || {
  scheduled: 'scheduled',
  completed: 'completed',
  cancelled: 'cancelled',
  no_show: 'no_show',
};

export const lead_priority = (PrismaClientPkg as any).lead_priority || {
  hot: 'hot',
  warm: 'warm',
  cold: 'cold',
};

export type lead_stage = keyof typeof lead_stage;
export type lead_source = keyof typeof lead_source;
export type lead_activity_type = keyof typeof lead_activity_type;
export type activity_status = keyof typeof activity_status;
export type lead_priority = keyof typeof lead_priority;

export { lead_stage as LeadStage };
export { lead_source as LeadSource };
export { lead_activity_type as ActivityType };
export { activity_status as ActivityStatus };
export { lead_priority as LeadPriority };

// Backward compatibility alias for status -> stage
export type LeadStatus = lead_stage;
export const LeadStatus = lead_stage;

export const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  [lead_stage.enquiry_received]: [
    lead_stage.qualified,
    lead_stage.counselling_scheduled,
    lead_stage.campus_visit,
    lead_stage.rejected,
  ],
  [lead_stage.qualified]: [
    lead_stage.counselling_scheduled,
    lead_stage.campus_visit,
    lead_stage.application_submitted,
    lead_stage.rejected,
  ],
  [lead_stage.counselling_scheduled]: [
    lead_stage.campus_visit,
    lead_stage.application_submitted,
    lead_stage.rejected,
  ],
  [lead_stage.campus_visit]: [
    lead_stage.application_submitted,
    lead_stage.rejected,
  ],
  [lead_stage.application_submitted]: [
    lead_stage.document_verification,
    lead_stage.assessment,
    lead_stage.rejected,
  ],
  [lead_stage.document_verification]: [
    lead_stage.assessment,
    lead_stage.admission_approved,
    lead_stage.rejected,
  ],
  [lead_stage.assessment]: [
    lead_stage.admission_approved,
    lead_stage.waitlisted,
    lead_stage.rejected,
  ],
  [lead_stage.admission_approved]: [
    lead_stage.fee_payment_pending,
    lead_stage.enrolled,
    lead_stage.rejected,
  ],
  [lead_stage.waitlisted]: [
    lead_stage.admission_approved,
    lead_stage.rejected,
  ],
  [lead_stage.fee_payment_pending]: [
    lead_stage.enrolled,
    lead_stage.rejected,
  ],
  [lead_stage.rejected]: [
    lead_stage.enquiry_received, // Allows reopening
  ],
  [lead_stage.enrolled]: [], // Terminal state
};
