import { NextFunction, Request, Response, Router } from 'express';
import { learningActivitiesUploadMiddleware } from './learning-activities.upload';
import { LearningActivitiesController } from './learning-activities.controller';
import { LearningActivitiesPolicy } from './learning-activities.policy';

export const learningActivitiesRouter: Router = Router();

function handleMultipartUpload(req: Request, res: Response, next: NextFunction) {
  learningActivitiesUploadMiddleware(req, res, (err: any) => {
    if (!err) return next();
    return res.status(err?.statusCode || 400).json({
      success: false,
      error: err?.code || 'UPLOAD_VALIDATION_ERROR',
      message: err?.message || 'Submission file upload validation failed.',
    });
  });
}

// ─── TEACHER LEARNING ACTIVITIES & EVALUATION ROUTES ────────────────────────
const teacherRouter = Router();
teacherRouter.use(LearningActivitiesPolicy.requireTeacherRole());
teacherRouter.get('/overview', LearningActivitiesController.getTeacherOverview);
teacherRouter.get('/assignments', LearningActivitiesController.getTeacherAssignments);
teacherRouter.get('/activities', LearningActivitiesController.listTeacherActivities);
teacherRouter.post('/activities', LearningActivitiesController.createTeacherActivity);
teacherRouter.post('/activities/close-due', LearningActivitiesController.closeDueActivitiesTeacher);
teacherRouter.get('/activities/:activityId', LearningActivitiesController.getTeacherActivityDetail);
teacherRouter.patch('/activities/:activityId', LearningActivitiesController.updateTeacherActivity);
teacherRouter.post(
  '/activities/:activityId/publish',
  LearningActivitiesController.publishTeacherActivity,
);
teacherRouter.post(
  '/activities/:activityId/close',
  LearningActivitiesController.closeTeacherActivity,
);
teacherRouter.post(
  '/activities/:activityId/extend-late',
  LearningActivitiesController.extendTeacherLateSubmission,
);
teacherRouter.get(
  '/activities/:activityId/audit',
  LearningActivitiesController.getTeacherActivityAudit,
);
teacherRouter.get('/submissions', LearningActivitiesController.listTeacherSubmissions);
teacherRouter.post(
  '/submissions/:submissionId/start-review',
  LearningActivitiesController.startSubmissionReview,
);
teacherRouter.post(
  '/submissions/:submissionId/reviews',
  LearningActivitiesController.reviewSubmission,
);
teacherRouter.get('/files/:fileId/download', LearningActivitiesController.downloadTeacherFile);
learningActivitiesRouter.use('/teacher', teacherRouter);

// ─── STUDENT LEARNING ACTIVITIES & PROJECT SUBMISSIONS ROUTES ───────────────
const studentRouter = Router();
studentRouter.use(LearningActivitiesPolicy.requireStudentRole());
studentRouter.get('/overview', LearningActivitiesController.getStudentOverview);
studentRouter.get('/activities', LearningActivitiesController.listStudentActivities);
studentRouter.get('/activities/:activityId', LearningActivitiesController.getStudentActivityDetail);
studentRouter.post(
  '/activities/:activityId/submit',
  handleMultipartUpload,
  LearningActivitiesController.submitStudentProject,
);
studentRouter.get('/files/:fileId/download', LearningActivitiesController.downloadStudentFile);
learningActivitiesRouter.use('/student', studentRouter);

// ─── PARENT LEARNING ACTIVITY MONITORING ROUTES (STRICT READ-ONLY) ──────────
const parentRouter = Router();
parentRouter.use(LearningActivitiesPolicy.requireParentRole());
parentRouter.get(
  '/children/:childId/overview',
  LearningActivitiesController.getParentChildOverview,
);
parentRouter.get(
  '/children/:childId/activities',
  LearningActivitiesController.listParentChildActivities,
);
parentRouter.get(
  '/children/:childId/activities/:activityId',
  LearningActivitiesController.getParentChildActivityDetail,
);
parentRouter.get(
  '/children/:childId/files/:fileId/download',
  LearningActivitiesController.downloadParentChildFile,
);
learningActivitiesRouter.use('/parent', parentRouter);

// ─── ADMIN INSTITUTIONAL OVERSIGHT ROUTES ───────────────────────────────────
const adminRouter = Router();
adminRouter.use(LearningActivitiesPolicy.requireAdminRole());
adminRouter.get('/overview', LearningActivitiesController.getAdminOverview);
adminRouter.get('/filters', LearningActivitiesController.getAdminFilters);
adminRouter.get('/activities', LearningActivitiesController.listAdminActivities);
adminRouter.get('/activities/:activityId', LearningActivitiesController.getAdminActivityDetail);
adminRouter.post('/activities/close-due', LearningActivitiesController.closeDueActivitiesAdmin);
adminRouter.get('/files/:fileId/download', LearningActivitiesController.downloadAdminFile);
learningActivitiesRouter.use('/admin', adminRouter);

export default learningActivitiesRouter;
