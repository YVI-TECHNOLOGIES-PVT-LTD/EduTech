import { Router } from 'express';
import { ClassroomPolicy } from './classroom.policy';
import { ClassroomController } from './classroom.controller';

export const classroomRouter: Router = Router();

// ─── TEACHER CLASSROOM ROUTES ───────────────────────────────────────────────
const teacherRouter = Router();
teacherRouter.use(ClassroomPolicy.requireTeacherRole());
teacherRouter.get('/overview', ClassroomController.getTeacherOverview);
teacherRouter.get('/classes', ClassroomController.getTeacherClasses);
teacherRouter.get('/sessions', ClassroomController.listTeacherSessions);
teacherRouter.post('/sessions', ClassroomController.createTeacherSession);
teacherRouter.get('/sessions/:sessionId', ClassroomController.getTeacherSessionDetail);
teacherRouter.patch('/sessions/:sessionId', ClassroomController.updateTeacherSession);
teacherRouter.post('/sessions/:sessionId/start', ClassroomController.startTeacherSession);
teacherRouter.post('/sessions/:sessionId/complete', ClassroomController.completeTeacherSession);
teacherRouter.post('/sessions/:sessionId/cancel', ClassroomController.cancelTeacherSession);
teacherRouter.post(
  '/sessions/:sessionId/not-conducted',
  ClassroomController.markTeacherSessionNotConducted,
);
teacherRouter.put('/sessions/:sessionId/attendance', ClassroomController.markTeacherAttendance);
teacherRouter.get('/sessions/:sessionId/audit', ClassroomController.getTeacherSessionAudit);
teacherRouter.post('/flipped-preparation', ClassroomController.createTeacherFlippedPreparation);
teacherRouter.get(
  '/flipped-preparation/:lessonPlanId',
  ClassroomController.getTeacherFlippedPreparationDetail,
);
classroomRouter.use('/teacher', teacherRouter);

// ─── ADMIN OVERSIGHT & TIMETABLE SESSION GENERATION ROUTES ──────────────────
const adminRouter = Router();
adminRouter.use(ClassroomPolicy.requireAdminRole());
adminRouter.get('/academic-years', ClassroomController.getAdminAcademicYears);
adminRouter.post('/sessions/generate', ClassroomController.generateAdminSessions);
adminRouter.get('/sessions', ClassroomController.listAdminSessions);
adminRouter.get('/sessions/:sessionId/audit', ClassroomController.getAdminSessionAudit);
classroomRouter.use('/admin', adminRouter);

// ─── STUDENT CLASSROOM ROUTES ───────────────────────────────────────────────
const studentRouter = Router();
studentRouter.use(ClassroomPolicy.requireStudentRole());
studentRouter.get('/overview', ClassroomController.getStudentOverview);
studentRouter.get('/classes', ClassroomController.getStudentClasses);
studentRouter.get('/sessions', ClassroomController.listStudentSessions);
studentRouter.get('/sessions/:sessionId', ClassroomController.getStudentSessionDetail);
studentRouter.post('/sessions/:sessionId/join', ClassroomController.joinStudentSession);
studentRouter.get('/attendance', ClassroomController.getStudentAttendance);
studentRouter.get('/flipped-preparation', ClassroomController.getStudentFlippedPreparations);
classroomRouter.use('/student', studentRouter);

// ─── PARENT CLASSROOM ROUTES (READ-ONLY) ────────────────────────────────────
const parentRouter = Router();
parentRouter.use(ClassroomPolicy.requireParentRole());
parentRouter.get('/children/:childId/overview', ClassroomController.getParentChildOverview);
parentRouter.get('/children/:childId/sessions', ClassroomController.listParentChildSessions);
parentRouter.get('/children/:childId/attendance', ClassroomController.getParentChildAttendance);
classroomRouter.use('/parent', parentRouter);

export default classroomRouter;
