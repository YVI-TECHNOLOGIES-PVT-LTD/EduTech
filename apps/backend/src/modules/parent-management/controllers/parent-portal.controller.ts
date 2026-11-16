import { Request, Response } from 'express';
import { ParentPortalService } from '../services/parent-portal.service';
import { ParentError } from '../errors/parent.errors';
import { extractParentSessionContext } from '../policies/parent-portal.policy';

function handleControllerError(res: Response, err: any, fallbackMessage: string) {
  if (err instanceof ParentError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.code,
      message: err.message,
    });
  }

  return res.status(err?.statusCode || 500).json({
    success: false,
    error: err?.code || 'INTERNAL_ERROR',
    message: err?.message || fallbackMessage,
  });
}

export class ParentPortalController {
  static async getDashboardOverview(req: Request, res: Response) {
    try {
      const { orgId, userId, email } = extractParentSessionContext(req);
      const childId = typeof req.query.childId === 'string' ? req.query.childId : undefined;
      const data = await ParentPortalService.getDashboardOverview(orgId, userId, email, childId);
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return handleControllerError(res, err, 'Failed to fetch parent dashboard overview');
    }
  }

  static async listChildren(req: Request, res: Response) {
    try {
      const { orgId, userId, email } = extractParentSessionContext(req);
      const data = await ParentPortalService.listAuthorizedChildren(orgId, userId, email);
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return handleControllerError(res, err, 'Failed to list linked children');
    }
  }

  static async getChildProfile(req: Request, res: Response) {
    try {
      const { orgId, userId, email } = extractParentSessionContext(req);
      const { childId } = req.params;
      const data = await ParentPortalService.getChildProfile(orgId, userId, email, childId);
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return handleControllerError(res, err, 'Failed to fetch child profile');
    }
  }

  static async getChildTodayTimetable(req: Request, res: Response) {
    try {
      const { orgId, userId, email } = extractParentSessionContext(req);
      const { childId } = req.params;
      const weekday = req.query.weekday ? Number(req.query.weekday) : undefined;
      const currentTimeHHMM =
        typeof req.query.time === 'string' && /^\d{2}:\d{2}$/.test(req.query.time)
          ? req.query.time
          : undefined;
      const data = await ParentPortalService.getChildTodayTimetable(orgId, userId, email, childId, {
        weekday,
        currentTimeHHMM,
      });
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return handleControllerError(res, err, "Failed to fetch today's timetable");
    }
  }

  static async getChildWeeklyTimetable(req: Request, res: Response) {
    try {
      const { orgId, userId, email } = extractParentSessionContext(req);
      const { childId } = req.params;
      const currentTimeHHMM =
        typeof req.query.time === 'string' && /^\d{2}:\d{2}$/.test(req.query.time)
          ? req.query.time
          : undefined;
      const data = await ParentPortalService.getChildWeeklyTimetable(
        orgId,
        userId,
        email,
        childId,
        { currentTimeHHMM },
      );
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return handleControllerError(res, err, 'Failed to fetch weekly timetable');
    }
  }

  static async getChildSubjects(req: Request, res: Response) {
    try {
      const { orgId, userId, email } = extractParentSessionContext(req);
      const { childId } = req.params;
      const data = await ParentPortalService.getChildSubjects(orgId, userId, email, childId);
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return handleControllerError(res, err, 'Failed to fetch subjects');
    }
  }

  static async getChildCurriculum(req: Request, res: Response) {
    try {
      const { orgId, userId, email } = extractParentSessionContext(req);
      const { childId } = req.params;
      const subjectId = typeof req.query.subjectId === 'string' ? req.query.subjectId : undefined;
      const data = await ParentPortalService.getChildCurriculumAndProgress(
        orgId,
        userId,
        email,
        childId,
        subjectId,
      );
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return handleControllerError(res, err, 'Failed to fetch curriculum');
    }
  }

  static async getChildAcademicProgress(req: Request, res: Response) {
    try {
      const { orgId, userId, email } = extractParentSessionContext(req);
      const { childId } = req.params;
      const subjectId = typeof req.query.subjectId === 'string' ? req.query.subjectId : undefined;
      const data = await ParentPortalService.getChildCurriculumAndProgress(
        orgId,
        userId,
        email,
        childId,
        subjectId,
      );
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return handleControllerError(res, err, 'Failed to fetch academic progress');
    }
  }

  static async getChildResources(req: Request, res: Response) {
    try {
      const { orgId, userId, email } = extractParentSessionContext(req);
      const { childId } = req.params;
      const data = await ParentPortalService.getChildResources(orgId, userId, email, childId, {
        subjectId: typeof req.query.subjectId === 'string' ? req.query.subjectId : undefined,
        categoryId: typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined,
        resourceType:
          typeof req.query.resourceType === 'string' ? req.query.resourceType : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return handleControllerError(res, err, 'Failed to fetch learning resources');
    }
  }

  static async previewChildResource(req: Request, res: Response) {
    try {
      const { orgId, userId, email } = extractParentSessionContext(req);
      const { childId, resourceId } = req.params;
      const data = await ParentPortalService.getChildResourcePreviewUrl(
        orgId,
        userId,
        email,
        childId,
        resourceId,
      );
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return handleControllerError(res, err, 'Failed to generate resource preview URL');
    }
  }

  static async downloadChildResource(req: Request, res: Response) {
    try {
      const { orgId, userId, email } = extractParentSessionContext(req);
      const { childId, resourceId } = req.params;
      const data = await ParentPortalService.getChildResourceDownloadUrl(
        orgId,
        userId,
        email,
        childId,
        resourceId,
      );
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return handleControllerError(res, err, 'Failed to generate resource download URL');
    }
  }

  static async getChildCalendar(req: Request, res: Response) {
    try {
      const { orgId, userId, email } = extractParentSessionContext(req);
      const { childId } = req.params;
      const data = await ParentPortalService.getChildCalendar(orgId, userId, email, childId, {
        entryType: typeof req.query.entryType === 'string' ? req.query.entryType : undefined,
        fromDate: typeof req.query.fromDate === 'string' ? req.query.fromDate : undefined,
        toDate: typeof req.query.toDate === 'string' ? req.query.toDate : undefined,
      });
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      return handleControllerError(res, err, 'Failed to fetch academic calendar');
    }
  }
}
