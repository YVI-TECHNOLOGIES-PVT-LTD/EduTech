import { Router } from 'express';
import multer from 'multer';
import { checkPermission } from '../../rbac/rbac.middleware';
import { PERMISSIONS } from '../../rbac/permissions';
import { checkIdempotency } from '../../middleware/idempotency.middleware';
import { documentController } from './index';

const upload = multer({ storage: multer.memoryStorage() });

export const documentRouter = Router();

// 1. Upload & View & Delete
documentRouter.post('/upload',
    upload.single('file'),
    checkPermission('admission.document.upload'),
    checkIdempotency,
    documentController.upload
);

documentRouter.post('/upload/bulk',
    upload.array('files', 20),
    checkPermission('admission.document.upload'),
    checkIdempotency,
    documentController.bulkUpload
);

documentRouter.get('/:id',
    checkPermission('admission.document.view'),
    documentController.getById
);

documentRouter.delete('/:id',
    checkPermission('admission.document.delete'),
    documentController.delete
);

// 2. Verification Review Status transitions
documentRouter.post('/:id/verify',
    checkPermission('admission.document.verify'),
    documentController.verify
);

documentRouter.post('/verify/bulk',
    checkPermission('admission.document.verify'),
    documentController.bulkVerify
);

documentRouter.post('/:id/reject',
    checkPermission('admission.document.verify'),
    documentController.reject
);

documentRouter.post('/:id/request-correction',
    checkPermission('admission.document.verify'),
    documentController.requestCorrection
);

// 3. Downloads & Checklists
documentRouter.get('/:id/download-url',
    checkPermission('admission.document.download'),
    documentController.getSignedUrl
);

documentRouter.get('/:id/versions',
    checkPermission('admission.document.view'),
    documentController.getVersions
);

documentRouter.post('/:id/restore',
    checkPermission('admission.document.upload'),
    documentController.restoreVersion
);

documentRouter.get('/checklist/:grade',
    checkPermission('admission.document.checklist'),
    documentController.getChecklist
);

documentRouter.get('/application/:applicationId',
    checkPermission('admission.document.view'),
    documentController.listByApplication
);
