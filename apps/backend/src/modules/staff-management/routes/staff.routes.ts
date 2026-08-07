import { Router } from 'express';
import { checkPermission } from '../../../rbac/rbac.middleware';
import { checkIdempotency } from '../../../middlewares/idempotency.middleware';
import { StaffController } from '../controllers/staff.controller';
import { DesignationController } from '../controllers/designation.controller';
import { StaffAnalyticsController } from '../controllers/staff-analytics.controller';
import { StaffPolicy } from '../policies/staff.policy';

export const staffRouter = Router();

// Analytics & Dashboard
staffRouter.get(
  '/dashboard',
  checkPermission(StaffPolicy.canView()),
  StaffAnalyticsController.getDashboard,
);
staffRouter.get('/search', checkPermission(StaffPolicy.canView()), StaffController.search);

// Designations CRUD
staffRouter.post(
  '/designations',
  checkPermission(StaffPolicy.canCreate()),
  checkIdempotency,
  DesignationController.create,
);
staffRouter.get(
  '/designations',
  checkPermission(StaffPolicy.canView()),
  DesignationController.getAll,
);
staffRouter.get(
  '/designations/:id',
  checkPermission(StaffPolicy.canView()),
  DesignationController.getById,
);
staffRouter.patch(
  '/designations/:id',
  checkPermission(StaffPolicy.canUpdate()),
  DesignationController.update,
);

// Staff Profile CRUD
staffRouter.post(
  '/',
  checkPermission(StaffPolicy.canCreate()),
  checkIdempotency,
  StaffController.create,
);
staffRouter.get('/', checkPermission(StaffPolicy.canView()), StaffController.search);
staffRouter.get('/:id', checkPermission(StaffPolicy.canView()), StaffController.getById);
staffRouter.patch('/:id', checkPermission(StaffPolicy.canUpdate()), StaffController.update);
staffRouter.delete('/:id', checkPermission(StaffPolicy.canDelete()), StaffController.delete);

// Staff Assignments
staffRouter.patch(
  '/:id/designation',
  checkPermission(StaffPolicy.canUpdate()),
  StaffController.assignDesignation,
);
staffRouter.patch(
  '/:id/user',
  checkPermission(StaffPolicy.canUpdate()),
  StaffController.assignUser,
);

// Timeline
staffRouter.get(
  '/:id/timeline',
  checkPermission(StaffPolicy.canView()),
  StaffAnalyticsController.getTimeline,
);
