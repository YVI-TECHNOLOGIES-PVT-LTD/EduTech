import { Router } from 'express';
import { checkPermission } from '../../rbac/rbac.middleware';
import { PERMISSIONS } from '../../rbac/permissions';
import { checkIdempotency } from '../../middleware/idempotency.middleware';
import { enrollmentController } from './index';

export const enrollmentRouter = Router();

// 1. Fee structure setup & waivers
enrollmentRouter.post('/fees/assign',
    checkPermission(PERMISSIONS.ADMISSION_FEES_INITIALIZE),
    checkIdempotency,
    enrollmentController.assignFeeStructure
);

enrollmentRouter.get('/fees/:applicationId',
    checkPermission(PERMISSIONS.APPLICATION_VIEW),
    enrollmentController.getFeesSummary
);

enrollmentRouter.post('/waivers',
    checkPermission(PERMISSIONS.FEES_WAIVER_APPROVE),
    checkIdempotency,
    enrollmentController.applyFeeWaiver
);

// 2. Payments collection & verification
enrollmentRouter.post('/payments',
    checkPermission(PERMISSIONS.PAYMENT_RECORD),
    checkIdempotency,
    enrollmentController.collectPayment
);

enrollmentRouter.post('/payments/verify',
    checkPermission(PERMISSIONS.PAYMENT_RECORD),
    checkIdempotency,
    enrollmentController.verifyPayment
);

enrollmentRouter.get('/payments/:paymentId/receipt',
    checkPermission(PERMISSIONS.FEES_RECEIPT_GENERATE),
    enrollmentController.getReceipt
);

// 3. Confirmations & handover enrollments
enrollmentRouter.post('/confirm',
    checkPermission('admission.confirm.enroll'),
    checkIdempotency,
    enrollmentController.confirmAdmission
);

enrollmentRouter.post('/enroll',
    checkPermission('admission.confirm.enroll'),
    checkIdempotency,
    enrollmentController.enrollStudent
);

enrollmentRouter.get('/status/:applicationId',
    checkPermission(PERMISSIONS.APPLICATION_VIEW),
    enrollmentController.getEnrollmentStatus
);
