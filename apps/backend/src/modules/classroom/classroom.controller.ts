import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { ClassroomError, ClassroomValidationError } from './classroom.types';
import { extractClassroomAuthContext } from './classroom.policy';
import {
  auditQuerySchema,
  cancelSessionSchema,
  completeSessionSchema,
  createFlippedPreparationSchema,
  createTeacherSessionSchema,
  generateSessionsSchema,
  listSessionsQuerySchema,
  markAttendanceSchema,
  notConductedSessionSchema,
  updateTeacherSessionSchema,
  uuidSchema,
} from './classroom.validation';
import { ClassroomService } from './classroom.service';

function handleControllerError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: error.errors.map((e) => `${e.path.join('.') || 'body'}: ${e.message}`).join('; '),
      details: error.errors,
    });
  }

  if (error instanceof ClassroomError) {
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
    message: (error as Error)?.message || 'Internal classroom server error',
  });
}

function parseUuidParam(value: string, label: string): string {
  const parsed = uuidSchema.safeParse(value);
  if (!parsed.success) {
    throw new ClassroomValidationError(`Invalid ${label} UUID`);
  }
  return parsed.data;
}

export class ClassroomController {
  // ─── TEACHER HANDLERS ────────────────────────────────────────────────────

  static async getTeacherOverview(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const data = await ClassroomService.getTeacherOverview(orgId, userId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async getTeacherClasses(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const data = await ClassroomService.getTeacherClasses(orgId, userId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async listTeacherSessions(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const query = listSessionsQuerySchema.parse(req.query);
      const data = await ClassroomService.listTeacherSessions(orgId, userId, query);
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async createTeacherSession(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const payload = createTeacherSessionSchema.parse(req.body);
      const data = await ClassroomService.createTeacherSession(orgId, userId, payload);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async getTeacherSessionDetail(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const sessionId = parseUuidParam(req.params.sessionId, 'sessionId');
      const data = await ClassroomService.getTeacherSessionDetail(orgId, userId, sessionId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async updateTeacherSession(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const sessionId = parseUuidParam(req.params.sessionId, 'sessionId');
      const payload = updateTeacherSessionSchema.parse(req.body);
      const data = await ClassroomService.updateTeacherSession(orgId, userId, sessionId, payload);
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async startTeacherSession(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const sessionId = parseUuidParam(req.params.sessionId, 'sessionId');
      const data = await ClassroomService.transitionTeacherSessionStatus(
        orgId,
        userId,
        sessionId,
        'in_progress',
      );
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async completeTeacherSession(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const sessionId = parseUuidParam(req.params.sessionId, 'sessionId');
      const payload = completeSessionSchema.parse(req.body || {});
      const data = await ClassroomService.transitionTeacherSessionStatus(
        orgId,
        userId,
        sessionId,
        'completed',
        payload,
      );
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async cancelTeacherSession(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const sessionId = parseUuidParam(req.params.sessionId, 'sessionId');
      const payload = cancelSessionSchema.parse(req.body || {});
      const data = await ClassroomService.transitionTeacherSessionStatus(
        orgId,
        userId,
        sessionId,
        'cancelled',
        payload,
      );
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async markTeacherSessionNotConducted(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const sessionId = parseUuidParam(req.params.sessionId, 'sessionId');
      const payload = notConductedSessionSchema.parse(req.body);
      const data = await ClassroomService.transitionTeacherSessionStatus(
        orgId,
        userId,
        sessionId,
        'not_conducted',
        payload,
      );
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async markTeacherAttendance(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const sessionId = parseUuidParam(req.params.sessionId, 'sessionId');
      const payload = markAttendanceSchema.parse(req.body);
      const data = await ClassroomService.markTeacherAttendance(
        orgId,
        userId,
        sessionId,
        payload.records,
      );
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async getTeacherSessionAudit(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const sessionId = parseUuidParam(req.params.sessionId, 'sessionId');
      const query = auditQuerySchema.parse(req.query);
      const data = await ClassroomService.getTeacherSessionAudit(orgId, userId, sessionId, query);
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  // ─── ADMIN HANDLERS ──────────────────────────────────────────────────────

  static async getAdminAcademicYears(req: Request, res: Response) {
    try {
      const { orgId } = extractClassroomAuthContext(req);
      const data = await ClassroomService.getAdminAcademicYears(orgId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async generateAdminSessions(req: Request, res: Response) {
    try {
      const { orgId } = extractClassroomAuthContext(req);
      const payload = generateSessionsSchema.parse(req.body);
      const data = await ClassroomService.generateAdminSessionsFromTimetable(orgId, payload);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async listAdminSessions(req: Request, res: Response) {
    try {
      const { orgId } = extractClassroomAuthContext(req);
      const query = listSessionsQuerySchema.parse(req.query);
      const data = await ClassroomService.listAdminSessions(orgId, query);
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async getAdminSessionAudit(req: Request, res: Response) {
    try {
      const { orgId } = extractClassroomAuthContext(req);
      const sessionId = parseUuidParam(req.params.sessionId, 'sessionId');
      const query = auditQuerySchema.parse(req.query);
      const data = await ClassroomService.getAdminSessionAudit(orgId, sessionId, query);
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  // ─── STUDENT HANDLERS ────────────────────────────────────────────────────

  static async getStudentOverview(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const data = await ClassroomService.getStudentOverview(orgId, userId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async getStudentClasses(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const data = await ClassroomService.getStudentClasses(orgId, userId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async listStudentSessions(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const query = listSessionsQuerySchema.parse(req.query);
      const data = await ClassroomService.listStudentSessions(orgId, userId, query);
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async getStudentSessionDetail(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const sessionId = parseUuidParam(req.params.sessionId, 'sessionId');
      const data = await ClassroomService.getStudentSessionDetail(orgId, userId, sessionId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async joinStudentSession(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const sessionId = parseUuidParam(req.params.sessionId, 'sessionId');
      const data = await ClassroomService.joinStudentSession(orgId, userId, sessionId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async getStudentAttendance(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const query = listSessionsQuerySchema
        .pick({ date_from: true, date_to: true, page: true, limit: true })
        .parse(req.query);
      const data = await ClassroomService.getStudentAttendance(orgId, userId, query);
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  // ─── PARENT HANDLERS (READ-ONLY) ─────────────────────────────────────────

  static async getParentChildOverview(req: Request, res: Response) {
    try {
      const { orgId, userId, email } = extractClassroomAuthContext(req);
      const childId = parseUuidParam(req.params.childId, 'childId');
      const data = await ClassroomService.getParentChildOverview(orgId, userId, email, childId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async listParentChildSessions(req: Request, res: Response) {
    try {
      const { orgId, userId, email } = extractClassroomAuthContext(req);
      const childId = parseUuidParam(req.params.childId, 'childId');
      const query = listSessionsQuerySchema.parse(req.query);
      const data = await ClassroomService.listParentChildSessions(
        orgId,
        userId,
        email,
        childId,
        query,
      );
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async getParentChildAttendance(req: Request, res: Response) {
    try {
      const { orgId, userId, email } = extractClassroomAuthContext(req);
      const childId = parseUuidParam(req.params.childId, 'childId');
      const query = listSessionsQuerySchema
        .pick({ date_from: true, date_to: true, page: true, limit: true })
        .parse(req.query);
      const data = await ClassroomService.getParentChildAttendance(
        orgId,
        userId,
        email,
        childId,
        query,
      );
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async createTeacherFlippedPreparation(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const payload = createFlippedPreparationSchema.parse(req.body);
      const data = await ClassroomService.createTeacherFlippedPreparation(orgId, userId, payload);
      return res.status(201).json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async getTeacherFlippedPreparationDetail(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const lessonPlanId = parseUuidParam(req.params.lessonPlanId, 'lessonPlanId');
      const data = await ClassroomService.getTeacherFlippedPreparationDetail(
        orgId,
        userId,
        lessonPlanId,
      );
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }

  static async getStudentFlippedPreparations(req: Request, res: Response) {
    try {
      const { orgId, userId } = extractClassroomAuthContext(req);
      const data = await ClassroomService.getStudentFlippedPreparations(orgId, userId);
      return res.json({ success: true, data });
    } catch (error) {
      return handleControllerError(res, error);
    }
  }
}
