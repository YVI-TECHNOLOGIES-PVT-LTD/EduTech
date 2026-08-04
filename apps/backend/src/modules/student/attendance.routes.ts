import { Router } from 'express';
import { checkPermission } from '../../rbac/rbac.middleware';
import { checkIdempotency } from '../../middleware/idempotency.middleware';
import { attendanceController } from './index';

export const attendanceRouter = Router();

// 1. Sessions and Marks
attendanceRouter.post('/session',
    checkPermission('attendance.mark'),
    checkIdempotency,
    attendanceController.getOrCreateSession
);

attendanceRouter.post('/daily/mark',
    checkPermission('attendance.mark'),
    checkIdempotency,
    attendanceController.markAttendance
);

attendanceRouter.post('/daily/bulk',
    checkPermission('attendance.mark'),
    checkIdempotency,
    attendanceController.bulkMark
);

attendanceRouter.post('/period/mark',
    checkPermission('attendance.mark'),
    checkIdempotency,
    attendanceController.markPeriod
);

// 2. Leaves requests and approvals
attendanceRouter.post('/leave/submit',
    checkPermission('attendance.leave.apply'),
    checkIdempotency,
    attendanceController.submitLeave
);

attendanceRouter.post('/leave/approve/:id',
    checkPermission('attendance.leave.approve'),
    checkIdempotency,
    attendanceController.approveLeave
);

// 3. Corrections
attendanceRouter.post('/correction/request',
    checkPermission('attendance.mark'),
    checkIdempotency,
    attendanceController.requestCorrection
);

attendanceRouter.post('/correction/approve/:id',
    checkPermission('attendance.correction.approve'),
    checkIdempotency,
    attendanceController.approveCorrection
);

// 4. Holidays and Calendar configs
attendanceRouter.post('/holiday',
    checkPermission('attendance.mark'),
    checkIdempotency,
    attendanceController.createHoliday
);

attendanceRouter.post('/working-days',
    checkPermission('attendance.mark'),
    checkIdempotency,
    attendanceController.configureWorkingDays
);

// 5. Reports, summaries, biometric syncs
attendanceRouter.post('/report/generate',
    checkPermission('attendance.verify'),
    checkIdempotency,
    attendanceController.generateReport
);

attendanceRouter.post('/biometric/sync',
    checkPermission('attendance.sync'),
    checkIdempotency,
    attendanceController.syncLogs
);

attendanceRouter.get('/summary/:studentId',
    checkPermission('attendance.verify'),
    attendanceController.getSummary
);

attendanceRouter.get('/timeline/:studentId',
    checkPermission('attendance.verify'),
    attendanceController.getTimeline
);
