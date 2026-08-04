import { Router, Request, Response } from 'express';
import { AdmissionController } from './admission.controller';
import { checkPermission } from '../../rbac/rbac.middleware';
import { PERMISSIONS } from '../../rbac/permissions';

export const admissionRouter = Router();

// PUBLIC Admission Routes (No Auth required)
admissionRouter.post('/public-apply', AdmissionController.publicApply);

// PROTECTED Admission Routes (Auth required)
// PARENT ROUTES
admissionRouter.post('/',
    checkPermission(PERMISSIONS.ADMISSION_CREATE),
    AdmissionController.create
);

admissionRouter.put('/:id',
    checkPermission(PERMISSIONS.ADMISSION_CREATE), // Shared permission for draft edits
    AdmissionController.update
);

admissionRouter.post('/:id/submit',
    checkPermission(PERMISSIONS.ADMISSION_CREATE),
    AdmissionController.submit
);

// SHARED LIST/DETAILS
admissionRouter.get('/stats',
    checkPermission(PERMISSIONS.ADMISSION_REVIEW),
    AdmissionController.getStats
);

admissionRouter.get('/',
    checkPermission(PERMISSIONS.ADMISSION_VIEW_SELF), // Both Parent and Staff can call, controller handles filtering
    AdmissionController.list
);

admissionRouter.get('/:id',
    checkPermission(PERMISSIONS.ADMISSION_VIEW_SELF),
    AdmissionController.getById
);

// STAFF REVIEW ROUTES
admissionRouter.post('/:id/review',
    checkPermission(PERMISSIONS.ADMISSION_REVIEW),
    AdmissionController.review
);

admissionRouter.post('/:id/verify-docs',
    checkPermission(PERMISSIONS.ADMISSION_REVIEW),
    AdmissionController.verifyDocs
);

admissionRouter.post('/:id/initiate-payment',
    checkPermission(PERMISSIONS.ADMISSION_REVIEW),
    AdmissionController.initiatePayment
);

admissionRouter.post('/:id/billing',
    checkPermission(PERMISSIONS.ADMISSION_REVIEW),
    AdmissionController.initializeBilling
);

admissionRouter.post('/:id/recommend',
    checkPermission(PERMISSIONS.ADMISSION_RECOMMEND),
    AdmissionController.recommend
);

admissionRouter.post('/:id/approve',
    checkPermission(PERMISSIONS.ADMISSION_APPROVE),
    AdmissionController.approve
);

admissionRouter.post('/:id/reject',
    checkPermission(PERMISSIONS.ADMISSION_REJECT),
    AdmissionController.reject
);

admissionRouter.post('/:id/enrol',
    checkPermission(PERMISSIONS.ADMISSION_ENROL),
    AdmissionController.enrol
);

admissionRouter.post('/:id/decide-login',
    checkPermission(PERMISSIONS.ADMISSION_APPROVE), // Reusing APPROVE permission or could be a new one
    AdmissionController.decideLogin
);

// PAYMENT ROUTES (Parent)
admissionRouter.post('/:id/pay',
    checkPermission(PERMISSIONS.ADMISSION_CREATE),
    AdmissionController.makePayment
);

// FINANCE ROUTES
admissionRouter.post('/:id/verify-fee',
    checkPermission(PERMISSIONS.ADMISSION_APPROVE), // Assuming Finance shares or needs specific perm
    AdmissionController.verifyFee
);

// DOCUMENT ROUTES
admissionRouter.post('/:id/documents',
    checkPermission(PERMISSIONS.ADMISSION_CREATE),
    AdmissionController.uploadDoc
);
