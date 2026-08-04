import { Router } from 'express';
import { checkPermission } from '../../rbac/rbac.middleware';
import { checkIdempotency } from '../../middleware/idempotency.middleware';
import { evaluationController } from './index';

export const evaluationRouter = Router();

// 1. Exams Templates & Schedule Allocations
evaluationRouter.post('/exam/template',
    checkPermission('admission.exam.manage'),
    checkIdempotency,
    evaluationController.createTemplate
);

evaluationRouter.post('/exam/schedule',
    checkPermission('admission.exam.manage'),
    checkIdempotency,
    evaluationController.scheduleExam
);

evaluationRouter.post('/exam/allocate',
    checkPermission('admission.exam.manage'),
    checkIdempotency,
    evaluationController.allocateCandidate
);

// 2. Exam Attendance & Marks published
evaluationRouter.post('/exam/attendance',
    checkPermission('admission.exam.evaluate'),
    checkIdempotency,
    evaluationController.recordAttendance
);

evaluationRouter.post('/exam/result',
    checkPermission('admission.exam.evaluate'),
    checkIdempotency,
    evaluationController.recordMarks
);

evaluationRouter.get('/exam/results/:id',
    checkPermission('admission.exam.evaluate'),
    evaluationController.getExamResults
);

// 3. Interview Schedule & Criteria Scoring
evaluationRouter.post('/interview/schedule',
    checkPermission('admission.interview.manage'),
    checkIdempotency,
    evaluationController.scheduleInterview
);

evaluationRouter.post('/interview/result',
    checkPermission('admission.interview.evaluate'),
    checkIdempotency,
    evaluationController.recordInterviewScore
);

// 4. Merit Engine Rank selections
evaluationRouter.post('/merit/generate',
    checkPermission('admission.merit.generate'),
    checkIdempotency,
    evaluationController.generateMeritList
);

evaluationRouter.get('/merit/:applicationId',
    checkPermission('admission.merit.generate'),
    evaluationController.getMeritList
);

// 5. Offer Letter dispatch Accept & Declines
evaluationRouter.post('/offer/generate',
    checkPermission('admission.offer.manage'),
    checkIdempotency,
    evaluationController.generateOffer
);

evaluationRouter.post('/offer/send',
    checkPermission('admission.offer.manage'),
    checkIdempotency,
    evaluationController.sendOffer
);

evaluationRouter.post('/offer/accept',
    evaluationController.acceptOffer
);

evaluationRouter.post('/offer/reject',
    evaluationController.rejectOffer
);

// 6. Enrichment timeline
evaluationRouter.get('/timeline/:applicationId',
    evaluationController.getTimeline
);
