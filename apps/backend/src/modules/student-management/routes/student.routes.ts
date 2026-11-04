import { Router } from 'express';
import { checkPermission } from '../../../rbac/rbac.middleware';
import { checkIdempotency } from '../../../middlewares/idempotency.middleware';
import { StudentController } from '../controllers/student.controller';
import { StudentEnrollmentController } from '../controllers/student-enrollment.controller';
import { StudentParentController } from '../controllers/student-parent.controller';
import { StudentAnalyticsController } from '../controllers/student-analytics.controller';
import { StudentAcademicsController } from '../controllers/student-academics.controller';
import { StudentPolicy } from '../policies/student.policy';

export const studentRouter = Router();

// Enrollment Desk & Approved Applications
studentRouter.get(
  '/approved-applications',
  checkPermission(StudentPolicy.canViewAll()),
  StudentController.getApprovedApplications,
);
studentRouter.post(
  '/convert-application/:applicationId',
  checkPermission(StudentPolicy.canCreate()),
  checkIdempotency,
  StudentController.convertApplication,
);

// Analytics & Dashboard
studentRouter.get(
  '/dashboard',
  checkPermission(StudentPolicy.canViewAll()),
  StudentAnalyticsController.getDashboard,
);
studentRouter.get('/search', checkPermission(StudentPolicy.canViewAll()), StudentController.search);

// Student Profile CRUD
studentRouter.post(
  '/',
  checkPermission(StudentPolicy.canCreate()),
  checkIdempotency,
  StudentController.create,
);
studentRouter.get('/', checkPermission(StudentPolicy.canViewAll()), StudentController.search);
studentRouter.get('/:id', checkPermission(StudentPolicy.canView()), StudentController.getById);
studentRouter.patch('/:id', checkPermission(StudentPolicy.canUpdate()), StudentController.update);
studentRouter.delete('/:id', checkPermission(StudentPolicy.canDelete()), StudentController.delete);
studentRouter.patch(
  '/:id/status',
  checkPermission(StudentPolicy.canUpdate()),
  checkIdempotency,
  StudentController.updateStatus,
);

// Timeline
studentRouter.get(
  '/:id/timeline',
  checkPermission(StudentPolicy.canView()),
  StudentAnalyticsController.getTimeline,
);

// Student Academics & Schedule Sub-Resources
studentRouter.get(
  '/:id/exams',
  checkPermission(StudentPolicy.canView()),
  StudentAcademicsController.getExams,
);
studentRouter.get(
  '/:id/attendance/summary',
  checkPermission(StudentPolicy.canView()),
  StudentAcademicsController.getAttendanceSummary,
);
studentRouter.get(
  '/:id/attendance/timeline',
  checkPermission(StudentPolicy.canView()),
  StudentAcademicsController.getAttendanceTimeline,
);
studentRouter.get(
  '/:id/timetable/today',
  checkPermission(StudentPolicy.canView()),
  StudentAcademicsController.getTodayTimetable,
);
studentRouter.get(
  '/:id/timetable/week',
  checkPermission(StudentPolicy.canView()),
  StudentAcademicsController.getWeekTimetable,
);
studentRouter.get(
  '/:id/homework',
  checkPermission(StudentPolicy.canView()),
  StudentAcademicsController.getHomework,
);
studentRouter.get(
  '/:id/results',
  checkPermission(StudentPolicy.canView()),
  StudentAcademicsController.getResults,
);
studentRouter.get(
  '/:id/transport',
  checkPermission(StudentPolicy.canView()),
  StudentAcademicsController.getTransport,
);
studentRouter.get(
  '/:id/library',
  checkPermission(StudentPolicy.canView()),
  StudentAcademicsController.getLibrary,
);
studentRouter.get(
  '/:id/library/history',
  checkPermission(StudentPolicy.canView()),
  StudentAcademicsController.getLibraryHistory,
);

// Child Resources: Enrollments & Section Assignments
studentRouter.post(
  '/:id/enrollments',
  checkPermission(StudentPolicy.canManageEnrollment()),
  checkIdempotency,
  StudentEnrollmentController.enroll,
);
studentRouter.get(
  '/:id/enrollments',
  checkPermission(StudentPolicy.canView()),
  StudentEnrollmentController.getEnrollments,
);
studentRouter.patch(
  '/enrollments/:id/section',
  checkPermission(StudentPolicy.canManageEnrollment()),
  StudentEnrollmentController.assignSection,
);

// Child Resources: Parent Linkage
studentRouter.post(
  '/:id/parents',
  checkPermission(StudentPolicy.canManageParents()),
  checkIdempotency,
  StudentParentController.linkParent,
);
studentRouter.get(
  '/:id/parents',
  checkPermission(StudentPolicy.canView()),
  StudentParentController.getParents,
);
studentRouter.delete(
  '/:id/parents/:parentId',
  checkPermission(StudentPolicy.canManageParents()),
  StudentParentController.unlinkParent,
);
