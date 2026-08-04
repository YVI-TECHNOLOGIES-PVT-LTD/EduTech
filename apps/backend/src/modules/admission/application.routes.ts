import { Router } from 'express';
import { checkPermission } from '../../rbac/rbac.middleware';
import { PERMISSIONS } from '../../rbac/permissions';
import { checkIdempotency } from '../../middleware/idempotency.middleware';
import { applicationController } from './index';

export const applicationRouter = Router();

// Parent portal — must be registered before /:id
applicationRouter.get('/my',
    checkPermission(PERMISSIONS.ADMISSION_VIEW_SELF),
    applicationController.listMine
);

applicationRouter.get('/stats',
    checkPermission(PERMISSIONS.ADMISSION_VIEW_ALL),
    applicationController.getStats
);

applicationRouter.get('/',
    checkPermission(PERMISSIONS.ADMISSION_VIEW_ALL),
    applicationController.list
);

// 1. Core Create & View
applicationRouter.post('/',
    checkPermission(PERMISSIONS.APPLICATION_CREATE),
    checkIdempotency,
    applicationController.create
);

applicationRouter.get('/:id',
    checkPermission(PERMISSIONS.APPLICATION_VIEW),
    applicationController.resume
);

// 2. Incremental PATCH Draft Sections
applicationRouter.patch('/:id/profile',
    checkPermission(PERMISSIONS.APPLICATION_UPDATE),
    applicationController.patchProfile
);

applicationRouter.patch('/:id/parents',
    checkPermission(PERMISSIONS.APPLICATION_UPDATE),
    applicationController.patchParents
);

applicationRouter.patch('/:id/education',
    checkPermission(PERMISSIONS.APPLICATION_UPDATE),
    applicationController.patchEducation
);

applicationRouter.patch('/:id/preferences',
    checkPermission(PERMISSIONS.APPLICATION_UPDATE),
    applicationController.patchPreferences
);

applicationRouter.patch('/:id/declaration',
    checkPermission(PERMISSIONS.APPLICATION_UPDATE),
    applicationController.patchDeclaration
);

// 3. Submit & Timeline
applicationRouter.post('/:id/submit',
    checkPermission(PERMISSIONS.APPLICATION_SUBMIT),
    checkIdempotency,
    applicationController.submit
);

applicationRouter.get('/:id/progress',
    checkPermission(PERMISSIONS.APPLICATION_VIEW),
    applicationController.getProgress
);

applicationRouter.get('/:id/timeline',
    checkPermission(PERMISSIONS.APPLICATION_VIEW),
    applicationController.getTimeline
);

// 4. State Transition & Soft Delete
applicationRouter.post('/:id/transition',
    checkPermission(PERMISSIONS.APPLICATION_UPDATE),
    applicationController.transition
);

applicationRouter.post('/:id/review',
    checkPermission(PERMISSIONS.ADMISSION_REVIEW),
    applicationController.review
);

applicationRouter.post('/:id/approve',
    checkPermission(PERMISSIONS.ADMISSION_APPROVE),
    applicationController.approve
);

applicationRouter.post('/:id/reject',
    checkPermission(PERMISSIONS.ADMISSION_REJECT),
    applicationController.reject
);

applicationRouter.post('/:id/verify-docs',
    checkPermission(PERMISSIONS.ADMISSION_REVIEW),
    applicationController.verifyDocuments
);

applicationRouter.delete('/:id',
    checkPermission(PERMISSIONS.APPLICATION_DELETE),
    applicationController.deleteDraft
);
