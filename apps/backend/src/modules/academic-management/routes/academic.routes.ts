import { Router } from 'express';
import { checkPermission } from '../../../rbac/rbac.middleware';
import { checkIdempotency } from '../../../middlewares/idempotency.middleware';
import { AcademicYearController } from '../controllers/academic-year.controller';
import { GradeController } from '../controllers/grade.controller';
import { SectionController } from '../controllers/section.controller';
import { AcademicYearGradeController } from '../controllers/academic-year-grade.controller';
import { AcademicDashboardController } from '../controllers/academic-dashboard.controller';
import { AcademicPolicy } from '../policies/academic.policy';

export const academicRouter = Router();

// Dashboard & Structure Tree
academicRouter.get('/dashboard', checkPermission(AcademicPolicy.canView()), AcademicDashboardController.getDashboard);
academicRouter.get('/years/:id/structure', checkPermission(AcademicPolicy.canView()), AcademicDashboardController.getStructureTree);

// Academic Years CRUD
academicRouter.post('/years', checkPermission(AcademicPolicy.canCreate()), checkIdempotency, AcademicYearController.create);
academicRouter.get('/years', checkPermission(AcademicPolicy.canView()), AcademicYearController.getAll);
academicRouter.get('/years/:id', checkPermission(AcademicPolicy.canView()), AcademicYearController.getById);
academicRouter.patch('/years/:id', checkPermission(AcademicPolicy.canUpdate()), AcademicYearController.update);

// Grades CRUD
academicRouter.post('/grades', checkPermission(AcademicPolicy.canCreate()), checkIdempotency, GradeController.create);
academicRouter.get('/grades', checkPermission(AcademicPolicy.canView()), GradeController.getAll);
academicRouter.get('/grades/:id', checkPermission(AcademicPolicy.canView()), GradeController.getById);
academicRouter.patch('/grades/:id', checkPermission(AcademicPolicy.canUpdate()), GradeController.update);

// Sections CRUD
academicRouter.post('/sections', checkPermission(AcademicPolicy.canCreate()), checkIdempotency, SectionController.create);
academicRouter.get('/sections/by-year-grade/:academicYearGradeId', checkPermission(AcademicPolicy.canView()), SectionController.getByAcademicYearGrade);
academicRouter.get('/sections/:id', checkPermission(AcademicPolicy.canView()), SectionController.getById);
academicRouter.patch('/sections/:id', checkPermission(AcademicPolicy.canUpdate()), SectionController.update);

// Academic Year Grades Mapping CRUD
academicRouter.post('/year-grades', checkPermission(AcademicPolicy.canCreate()), checkIdempotency, AcademicYearGradeController.create);
academicRouter.get('/year-grades/by-year/:academicYearId', checkPermission(AcademicPolicy.canView()), AcademicYearGradeController.getByAcademicYear);
academicRouter.get('/year-grades/:id', checkPermission(AcademicPolicy.canView()), AcademicYearGradeController.getById);
academicRouter.patch('/year-grades/:id', checkPermission(AcademicPolicy.canUpdate()), AcademicYearGradeController.update);
