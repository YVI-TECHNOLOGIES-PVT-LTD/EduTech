import { Router } from 'express';
import { checkPermission } from '../../../rbac/rbac.middleware';
import { checkIdempotency } from '../../../middlewares/idempotency.middleware';
import { uploadSingleMiddleware } from '../../../middlewares/upload.middleware';
import { AdmissionController } from '../controllers/admission.controller';
import { AdmissionDocumentController } from '../controllers/admission-document.controller';
import { AdmissionAssessmentController } from '../controllers/admission-assessment.controller';
import { AdmissionDecisionController } from '../controllers/admission-decision.controller';
import { AdmissionPaymentController } from '../controllers/admission-payment.controller';
import { AdmissionAnalyticsController } from '../controllers/admission-analytics.controller';
import { AdmissionPolicy } from '../policies/admission.policy';

export const admissionRouter = Router();

// Analytics & Dashboard
admissionRouter.get(
  '/dashboard',
  checkPermission(AdmissionPolicy.canView()),
  AdmissionAnalyticsController.getDashboard,
);
admissionRouter.get(
  '/pending',
  checkPermission(AdmissionPolicy.canView()),
  AdmissionAnalyticsController.getPendingItems,
);
admissionRouter.get(
  '/search',
  checkPermission(AdmissionPolicy.canView()),
  AdmissionController.search,
);

// Application CRUD
admissionRouter.post(
  '/',
  checkPermission(AdmissionPolicy.canCreate()),
  checkIdempotency,
  AdmissionController.create,
);
admissionRouter.get('/', checkPermission(AdmissionPolicy.canView()), AdmissionController.search);
admissionRouter.get(
  '/mine',
  checkPermission(AdmissionPolicy.canView()),
  AdmissionController.getMine,
);
admissionRouter.get(
  '/document-types',
  checkPermission(AdmissionPolicy.canView()),
  AdmissionDocumentController.getDocumentTypes,
);
admissionRouter.get(
  '/fee-config',
  checkPermission(AdmissionPolicy.canView()),
  AdmissionPaymentController.getFeeConfig,
);
admissionRouter.get(
  '/:id',
  checkPermission(AdmissionPolicy.canView()),
  AdmissionController.getById,
);
admissionRouter.patch(
  '/:id',
  checkPermission(AdmissionPolicy.canUpdate()),
  AdmissionController.update,
);
admissionRouter.delete(
  '/:id',
  checkPermission(AdmissionPolicy.canDelete()),
  AdmissionController.delete,
);
admissionRouter.patch(
  '/:id/status',
  checkPermission(AdmissionPolicy.canUpdate()),
  checkIdempotency,
  AdmissionController.updateStatus,
);

// Timeline
admissionRouter.get(
  '/:id/timeline',
  checkPermission(AdmissionPolicy.canView()),
  AdmissionAnalyticsController.getTimeline,
);

// Child Resources: Documents
admissionRouter.post(
  '/:id/documents',
  checkPermission(AdmissionPolicy.canUploadDocument()),
  uploadSingleMiddleware,
  checkIdempotency,
  AdmissionDocumentController.upload,
);
admissionRouter.get(
  '/:id/documents',
  checkPermission(AdmissionPolicy.canView()),
  AdmissionDocumentController.getByApplicationId,
);
admissionRouter.get(
  '/documents/:id/signed-url',
  checkPermission(AdmissionPolicy.canView()),
  AdmissionDocumentController.getSignedUrl,
);
admissionRouter.patch(
  '/documents/:id/verify',
  checkPermission(AdmissionPolicy.canManageDocuments()),
  AdmissionDocumentController.verify,
);
admissionRouter.delete(
  '/documents/:id',
  checkPermission(AdmissionPolicy.canManageDocuments()),
  AdmissionDocumentController.delete,
);

// Child Resources: Assessment
admissionRouter.post(
  '/:id/assessment',
  checkPermission(AdmissionPolicy.canManageAssessments()),
  checkIdempotency,
  AdmissionAssessmentController.record,
);
admissionRouter.get(
  '/:id/assessment',
  checkPermission(AdmissionPolicy.canView()),
  AdmissionAssessmentController.getByApplicationId,
);

// Child Resources: Decision
admissionRouter.post(
  '/:id/decision',
  checkPermission(AdmissionPolicy.canManageDecisions()),
  checkIdempotency,
  AdmissionDecisionController.record,
);
admissionRouter.get(
  '/:id/decision',
  checkPermission(AdmissionPolicy.canView()),
  AdmissionDecisionController.getByApplicationId,
);

// Child Resources: Payment & Fee Calculation
admissionRouter.get(
  '/:id/fee',
  checkPermission(AdmissionPolicy.canView()),
  AdmissionPaymentController.getFee,
);
admissionRouter.post(
  '/:id/payment',
  checkPermission(AdmissionPolicy.canManagePayments()),
  checkIdempotency,
  AdmissionPaymentController.record,
);
admissionRouter.get(
  '/:id/payment',
  checkPermission(AdmissionPolicy.canView()),
  AdmissionPaymentController.getByApplicationId,
);
admissionRouter.get(
  '/:id/receipt',
  checkPermission(AdmissionPolicy.canView()),
  AdmissionPaymentController.getReceipt,
);
