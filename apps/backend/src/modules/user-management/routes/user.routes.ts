import { Router } from 'express';
import { checkPermission } from '../../../rbac/rbac.middleware';
import { checkIdempotency } from '../../../middlewares/idempotency.middleware';
import { UserController } from '../controllers/user.controller';
import { RoleController } from '../controllers/role.controller';
import { UserRoleController } from '../controllers/user-role.controller';
import { UserAnalyticsController } from '../controllers/user-analytics.controller';
import { UserPolicy } from '../policies/user.policy';

export const userRouter = Router();

// Analytics & Dashboard
userRouter.get(
  '/dashboard',
  checkPermission(UserPolicy.canView()),
  UserAnalyticsController.getDashboard,
);
userRouter.get('/search', checkPermission(UserPolicy.canView()), UserController.search);

// Roles CRUD
userRouter.post(
  '/roles',
  checkPermission(UserPolicy.canManageRoles()),
  checkIdempotency,
  RoleController.create,
);
userRouter.get('/roles', checkPermission(UserPolicy.canView()), RoleController.getAll);
userRouter.get('/roles/:id', checkPermission(UserPolicy.canView()), RoleController.getById);
userRouter.patch('/roles/:id', checkPermission(UserPolicy.canManageRoles()), RoleController.update);

// User Profile CRUD
userRouter.post(
  '/',
  checkPermission(UserPolicy.canCreate()),
  checkIdempotency,
  UserController.create,
);
userRouter.get('/', checkPermission(UserPolicy.canView()), UserController.search);
userRouter.get('/:id', checkPermission(UserPolicy.canView()), UserController.getById);
userRouter.patch('/:id', checkPermission(UserPolicy.canUpdate()), UserController.update);
userRouter.patch(
  '/:id/status',
  checkPermission(UserPolicy.canUpdate()),
  UserController.updateStatus,
);

// User Role Assignments
userRouter.post(
  '/:userId/roles',
  checkPermission(UserPolicy.canManageRoles()),
  checkIdempotency,
  UserRoleController.assignRole,
);
userRouter.delete(
  '/:userId/roles/:roleId',
  checkPermission(UserPolicy.canManageRoles()),
  UserRoleController.removeRole,
);

// Timeline
userRouter.get(
  '/:id/timeline',
  checkPermission(UserPolicy.canView()),
  UserAnalyticsController.getTimeline,
);
