import { Router } from 'express';
import { checkPermission } from '../../../rbac/rbac.middleware';
import { checkIdempotency } from '../../../middlewares/idempotency.middleware';
import { ParentController } from '../controllers/parent.controller';
import { ParentStudentController } from '../controllers/parent-student.controller';
import { ParentAnalyticsController } from '../controllers/parent-analytics.controller';
import { ParentPolicy } from '../policies/parent.policy';

export const parentRouter = Router();

// Analytics & Dashboard
parentRouter.get('/dashboard', checkPermission(ParentPolicy.canView()), ParentAnalyticsController.getDashboard);
parentRouter.get('/search', checkPermission(ParentPolicy.canView()), ParentController.search);

// Parent Profile CRUD
parentRouter.post('/', checkPermission(ParentPolicy.canCreate()), checkIdempotency, ParentController.create);
parentRouter.get('/', checkPermission(ParentPolicy.canView()), ParentController.search);
parentRouter.get('/:id', checkPermission(ParentPolicy.canView()), ParentController.getById);
parentRouter.patch('/:id', checkPermission(ParentPolicy.canUpdate()), ParentController.update);
parentRouter.delete('/:id', checkPermission(ParentPolicy.canDelete()), ParentController.delete);

// Timeline
parentRouter.get('/:id/timeline', checkPermission(ParentPolicy.canView()), ParentAnalyticsController.getTimeline);

// Child Resources: Student Linkage
parentRouter.post('/:id/students', checkPermission(ParentPolicy.canManageStudents()), checkIdempotency, ParentStudentController.linkStudent);
parentRouter.get('/:id/students', checkPermission(ParentPolicy.canView()), ParentStudentController.getStudents);
parentRouter.delete('/:id/students/:studentId', checkPermission(ParentPolicy.canManageStudents()), ParentStudentController.unlinkStudent);
