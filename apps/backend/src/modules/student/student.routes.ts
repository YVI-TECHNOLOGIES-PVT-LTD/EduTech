import { Router } from 'express';
import { checkPermission } from '../../rbac/rbac.middleware';
import { checkIdempotency } from '../../middleware/idempotency.middleware';
import { studentController } from './index';

export const studentRouter = Router();

// 1. Core Student Registrations
studentRouter.post('/',
    checkPermission('student.create'),
    checkIdempotency,
    studentController.createStudent
);

studentRouter.get('/',
    checkPermission('student.view'),
    studentController.listStudents
);

studentRouter.get('/:id',
    checkPermission('student.view'),
    studentController.getStudent
);

// 2. Profile and parent mappings
studentRouter.patch('/:id/profile',
    checkPermission('student.update'),
    studentController.updateProfile
);

studentRouter.patch('/:id/parents',
    checkPermission('student.update'),
    studentController.addParent
);

// 3. Class allocation, promotion and transfers
studentRouter.post('/:id/allocate',
    checkPermission('student.create'),
    checkIdempotency,
    studentController.allocateClass
);

studentRouter.post('/:id/promote',
    checkPermission('student.promote'),
    checkIdempotency,
    studentController.promoteStudent
);

studentRouter.post('/:id/transfer',
    checkPermission('student.transfer'),
    checkIdempotency,
    studentController.requestTransfer
);

studentRouter.post('/transfer/approve/:id',
    checkPermission('student.transfer'),
    checkIdempotency,
    studentController.approveTransfer
);

// 4. Identity cards
studentRouter.post('/:id/id-card',
    checkPermission('student.identity.generate'),
    checkIdempotency,
    studentController.generateIdCard
);

studentRouter.post('/:id/barcode',
    checkPermission('student.identity.generate'),
    studentController.getBarcode
);

// 5. Timelines & history
studentRouter.get('/:id/timeline',
    checkPermission('student.view'),
    studentController.getTimeline
);

studentRouter.get('/:id/history',
    checkPermission('student.view'),
    studentController.getHistory
);
