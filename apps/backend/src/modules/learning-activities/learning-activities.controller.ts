import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { extractLearningActivityAuthContext } from './learning-activities.policy';
import { LearningActivitiesService } from './learning-activities.service';
import {
  LearningActivityError,
  LearningActivityValidationError,
} from './learning-activities.types';
import {
  closeActivitySchema,
  createActivitySchema,
  createStudentSubmissionSchema,
  createTeacherReviewSchema,
  extendLateSubmissionSchema,
  listActivitiesQuerySchema,
  listTeacherSubmissionsQuerySchema,
  updateActivitySchema,
  uuidSchema,
} from './learning-activities.validation';

function handleError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: error.errors.map((e) => `${e.path.join('.') || 'body'}: ${e.message}`).join('; '),
      details: error.errors,
    });
  }

  if (error instanceof LearningActivityError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.code,
      message: error.message,
      details: error.details,
    });
  }

  return res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: (error as Error)?.message || 'Internal learning activities server error',
  });
}

function parseUuid(value: string, label: string): string {
  const parsed = uuidSchema.safeParse(value);
  if (!parsed.success) {
    throw new LearningActivityValidationError(`Invalid ${label} UUID`);
  }
  return parsed.data;
}

export class LearningActivitiesController {
  // ─── TEACHER ─────────────────────────────────────────────────────────────

  static async getTeacherOverview(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const data = await LearningActivitiesService.getTeacherOverview(orgId, userId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async getTeacherAssignments(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const data = await LearningActivitiesService.getTeacherAssignments(orgId, userId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async listTeacherActivities(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const filters = listActivitiesQuerySchema.parse(req.query);
      const data = await LearningActivitiesService.listTeacherActivities(orgId, userId, filters);
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async createTeacherActivity(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const payload = createActivitySchema.parse(req.body);
      const data = await LearningActivitiesService.createTeacherActivity(orgId, userId, payload);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async getTeacherActivityDetail(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const activityId = parseUuid(req.params.activityId, 'activityId');
      const data = await LearningActivitiesService.getTeacherActivityDetail(
        orgId,
        userId,
        activityId,
      );
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async updateTeacherActivity(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const activityId = parseUuid(req.params.activityId, 'activityId');
      const payload = updateActivitySchema.parse(req.body);
      const data = await LearningActivitiesService.updateTeacherActivity(
        orgId,
        userId,
        activityId,
        payload,
      );
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async publishTeacherActivity(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const activityId = parseUuid(req.params.activityId, 'activityId');
      const data = await LearningActivitiesService.publishTeacherActivity(
        orgId,
        userId,
        activityId,
      );
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async closeTeacherActivity(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const activityId = parseUuid(req.params.activityId, 'activityId');
      const body = closeActivitySchema.parse(req.body || {});
      const data = await LearningActivitiesService.closeTeacherActivity(
        orgId,
        userId,
        activityId,
        body.closure_reason,
      );
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async extendTeacherLateSubmission(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const activityId = parseUuid(req.params.activityId, 'activityId');
      const body = extendLateSubmissionSchema.parse(req.body);
      const data = await LearningActivitiesService.extendTeacherLateSubmission(
        orgId,
        userId,
        activityId,
        body.late_submission_authorized_until,
      );
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async closeDueActivitiesTeacher(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const data = await LearningActivitiesService.closeDueActivitiesForTeacher(orgId, userId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async getTeacherActivityAudit(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const activityId = parseUuid(req.params.activityId, 'activityId');
      const data = await LearningActivitiesService.getTeacherActivityAudit(
        orgId,
        userId,
        activityId,
      );
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async listTeacherSubmissions(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const filters = listTeacherSubmissionsQuerySchema.parse(req.query);
      const data = await LearningActivitiesService.listTeacherSubmissions(orgId, userId, filters);
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async startSubmissionReview(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const submissionId = parseUuid(req.params.submissionId, 'submissionId');
      const data = await LearningActivitiesService.startSubmissionReview(
        orgId,
        userId,
        submissionId,
      );
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async reviewSubmission(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const submissionId = parseUuid(req.params.submissionId, 'submissionId');
      const body = createTeacherReviewSchema.parse(req.body);
      const data = await LearningActivitiesService.reviewSubmission(
        orgId,
        userId,
        submissionId,
        body,
      );
      return res.status(201).json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async downloadTeacherFile(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const fileId = parseUuid(req.params.fileId, 'fileId');
      const data = await LearningActivitiesService.getSubmissionFileDownloadUrl({
        orgId,
        roleScope: 'teacher',
        userId,
        fileId,
      });
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ─── STUDENT ─────────────────────────────────────────────────────────────

  static async getStudentOverview(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const data = await LearningActivitiesService.getStudentOverview(orgId, userId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async listStudentActivities(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const filters = listActivitiesQuerySchema.parse(req.query);
      const data = await LearningActivitiesService.listStudentActivities(orgId, userId, filters);
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async getStudentActivityDetail(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const activityId = parseUuid(req.params.activityId, 'activityId');
      const data = await LearningActivitiesService.getStudentActivityDetail(
        orgId,
        userId,
        activityId,
      );
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async submitStudentProject(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const activityId = parseUuid(req.params.activityId, 'activityId');
      const body = createStudentSubmissionSchema.parse(req.body || {});
      const files = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];
      const data = await LearningActivitiesService.submitStudentProjectAttempt(
        orgId,
        userId,
        activityId,
        body.text_content ?? null,
        files,
      );
      return res.status(201).json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async downloadStudentFile(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const fileId = parseUuid(req.params.fileId, 'fileId');
      const data = await LearningActivitiesService.getSubmissionFileDownloadUrl({
        orgId,
        roleScope: 'student',
        userId,
        fileId,
      });
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ─── PARENT (READ-ONLY) ──────────────────────────────────────────────────

  static async getParentChildOverview(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const childId = parseUuid(req.params.childId, 'childId');
      const data = await LearningActivitiesService.getParentChildOverview(orgId, userId, childId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async listParentChildActivities(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const childId = parseUuid(req.params.childId, 'childId');
      const filters = listActivitiesQuerySchema.parse(req.query);
      const data = await LearningActivitiesService.listParentChildActivities(
        orgId,
        userId,
        childId,
        filters,
      );
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async getParentChildActivityDetail(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const childId = parseUuid(req.params.childId, 'childId');
      const activityId = parseUuid(req.params.activityId, 'activityId');
      const data = await LearningActivitiesService.getParentChildActivityDetail(
        orgId,
        userId,
        childId,
        activityId,
      );
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async downloadParentChildFile(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const childId = parseUuid(req.params.childId, 'childId');
      const fileId = parseUuid(req.params.fileId, 'fileId');
      const data = await LearningActivitiesService.getSubmissionFileDownloadUrl({
        orgId,
        roleScope: 'parent',
        userId,
        childId,
        fileId,
      });
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  // ─── ADMIN OVERSIGHT ─────────────────────────────────────────────────────

  static async getAdminOverview(req: Request, res: Response) {
    try {
      const { orgId } = extractLearningActivityAuthContext(req);
      const data = await LearningActivitiesService.getAdminOverview(orgId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async getAdminFilters(req: Request, res: Response) {
    try {
      const { orgId } = extractLearningActivityAuthContext(req);
      const data = await LearningActivitiesService.getAdminFilters(orgId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async listAdminActivities(req: Request, res: Response) {
    try {
      const { orgId } = extractLearningActivityAuthContext(req);
      const filters = listActivitiesQuerySchema.parse(req.query);
      const data = await LearningActivitiesService.listAdminActivities(orgId, filters);
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async getAdminActivityDetail(req: Request, res: Response) {
    try {
      const { orgId } = extractLearningActivityAuthContext(req);
      const activityId = parseUuid(req.params.activityId, 'activityId');
      const data = await LearningActivitiesService.getAdminActivityDetail(orgId, activityId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async closeDueActivitiesAdmin(req: Request, res: Response) {
    try {
      const { orgId } = extractLearningActivityAuthContext(req);
      const data = await LearningActivitiesService.closeDueActivitiesForAdmin(orgId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }

  static async downloadAdminFile(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractLearningActivityAuthContext(req);
      const fileId = parseUuid(req.params.fileId, 'fileId');
      const data = await LearningActivitiesService.getSubmissionFileDownloadUrl({
        orgId,
        roleScope: 'admin',
        userId,
        fileId,
      });
      return res.json({ success: true, data });
    } catch (error) {
      return handleError(res, error);
    }
  }
}
