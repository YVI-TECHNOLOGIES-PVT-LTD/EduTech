import { Router } from 'express';
import { DepartmentController } from './department.controller';
import { authenticate } from '../../auth/auth.middleware';
import { checkPermission } from '../../rbac/rbac.middleware';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('DEPARTMENT_VIEW' as any), DepartmentController.getAll);
router.post('/', checkPermission('DEPARTMENT_CREATE' as any), DepartmentController.create);
router.put('/:id', checkPermission('DEPARTMENT_UPDATE' as any), DepartmentController.update);
router.delete('/:id', checkPermission('DEPARTMENT_DELETE' as any), DepartmentController.delete);

export default router;
