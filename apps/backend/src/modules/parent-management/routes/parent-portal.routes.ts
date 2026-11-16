import { Router } from 'express';
import { ParentPortalController } from '../controllers/parent-portal.controller';
import { ParentPortalPolicy } from '../policies/parent-portal.policy';

const router: Router = Router();

// Strictly enforce authenticated Parent / Guardian role for all Parent Portal academic routes
router.use(ParentPortalPolicy.requireParentRole());

router.get('/dashboard/overview', ParentPortalController.getDashboardOverview);
router.get('/children', ParentPortalController.listChildren);
router.get('/children/:childId', ParentPortalController.getChildProfile);
router.get('/children/:childId/timetable/today', ParentPortalController.getChildTodayTimetable);
router.get('/children/:childId/timetable/weekly', ParentPortalController.getChildWeeklyTimetable);
router.get('/children/:childId/subjects', ParentPortalController.getChildSubjects);
router.get('/children/:childId/curriculum', ParentPortalController.getChildCurriculum);
router.get('/children/:childId/academic-progress', ParentPortalController.getChildAcademicProgress);
router.get('/children/:childId/resources', ParentPortalController.getChildResources);
router.get(
  '/children/:childId/resources/:resourceId/preview',
  ParentPortalController.previewChildResource,
);
router.get(
  '/children/:childId/resources/:resourceId/download',
  ParentPortalController.downloadChildResource,
);
router.get('/children/:childId/calendar', ParentPortalController.getChildCalendar);

export default router;
