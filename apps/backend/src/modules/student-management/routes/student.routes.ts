import { Router } from 'express';
import { checkPermission } from '../../../rbac/rbac.middleware';
import { checkIdempotency } from '../../../middlewares/idempotency.middleware';
import { StudentController } from '../controllers/student.controller';
import { StudentEnrollmentController } from '../controllers/student-enrollment.controller';
import { StudentParentController } from '../controllers/student-parent.controller';
import { StudentAnalyticsController } from '../controllers/student-analytics.controller';
import { StudentPolicy } from '../policies/student.policy';

export const studentRouter = Router();

// Analytics & Dashboard
studentRouter.get('/dashboard', checkPermission(StudentPolicy.canView()), StudentAnalyticsController.getDashboard);
studentRouter.get('/search', checkPermission(StudentPolicy.canView()), StudentController.search);

// Student Profile CRUD
studentRouter.post('/', checkPermission(StudentPolicy.canCreate()), checkIdempotency, StudentController.create);
studentRouter.get('/', checkPermission(StudentPolicy.canView()), StudentController.search);
studentRouter.get('/:id', checkPermission(StudentPolicy.canView()), StudentController.getById);
studentRouter.patch('/:id', checkPermission(StudentPolicy.canUpdate()), StudentController.update);
studentRouter.delete('/:id', checkPermission(StudentPolicy.canDelete()), StudentController.delete);
studentRouter.patch('/:id/status', checkPermission(StudentPolicy.canUpdate()), checkIdempotency, StudentController.updateStatus);

// Timeline
studentRouter.get('/:id/timeline', checkPermission(StudentPolicy.canView()), StudentAnalyticsController.getTimeline);

// Child Resources: Enrollments & Section Assignments
studentRouter.post('/:id/enrollments', checkPermission(StudentPolicy.canManageEnrollment()), checkIdempotency, StudentEnrollmentController.enroll);
studentRouter.get('/:id/enrollments', checkPermission(StudentPolicy.canView()), StudentEnrollmentController.getEnrollments);
studentRouter.patch('/enrollments/:id/section', checkPermission(StudentPolicy.canManageEnrollment()), StudentEnrollmentController.assignSection);

// Child Resources: Parent Linkage
studentRouter.post('/:id/parents', checkPermission(StudentPolicy.canManageParents()), checkIdempotency, StudentParentController.linkParent);
studentRouter.get('/:id/parents', checkPermission(StudentPolicy.canView()), StudentParentController.getParents);
studentRouter.delete('/:id/parents/:parentId', checkPermission(StudentPolicy.canManageParents()), StudentParentController.unlinkParent);
