import {
  getApplicationStatusSummary,
  type ApplicationStatusSummary,
} from './AdmissionStatusMapper';
import type { ApplicationRecord } from '@/shared/api/admission.api';

export type FormStatusResult = ApplicationStatusSummary['form'];
export type DocumentStatusResult = ApplicationStatusSummary['documents'];
export type PaymentStatusResult = ApplicationStatusSummary['payment'];
export type EvaluationStatusResult = ApplicationStatusSummary['evaluation'];

/**
 * Returns the derived FORM block status for an application.
 */
export function getFormStatus(app: ApplicationRecord | null | undefined): FormStatusResult {
  const summary = getApplicationStatusSummary(app);
  return summary.form;
}

/**
 * Returns the derived DOCUMENTS block status for an application.
 */
export function getDocumentStatus(app: ApplicationRecord | null | undefined): DocumentStatusResult {
  const summary = getApplicationStatusSummary(app);
  return summary.documents;
}

/**
 * Returns the derived PAYMENT block status for an application.
 */
export function getPaymentStatus(app: ApplicationRecord | null | undefined): PaymentStatusResult {
  const summary = getApplicationStatusSummary(app);
  return summary.payment;
}

/**
 * Returns the derived EVALUATION block status for an application.
 */
export function getEvaluationStatus(app: ApplicationRecord | null | undefined): EvaluationStatusResult {
  const summary = getApplicationStatusSummary(app);
  return summary.evaluation;
}

export {
  getApplicationStatusSummary,
  type ApplicationStatusSummary,
};
