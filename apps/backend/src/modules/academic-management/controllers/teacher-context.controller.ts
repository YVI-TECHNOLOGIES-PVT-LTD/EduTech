import { Request, Response } from 'express';
import { TeacherContextService } from '../services/teacher-context.service';
import { ResponseHelper } from '../utils/response.helper';
import { AcademicError } from '../errors/academic.errors';

function extractContext(req: Request) {
  const user = (req as any).context?.user;
  const orgId = user?.org_id || user?.school_id || (req as any).tenantOrgId;
  if (!orgId) {
    throw new AcademicError('Tenant context is required', 401, 'UNAUTHORIZED');
  }
  const userId = user?.id || (req as any).userId;
  if (!userId) {
    throw new AcademicError('User authentication context is required', 401, 'UNAUTHORIZED');
  }
  const roles: string[] = user?.roles || [];
  return { orgId, userId, roles };
}

export class TeacherContextController {
  /**
   * GET /v1/academic/teacher/dashboard
   */
  static async getDashboard(req: Request, res: Response) {
    try {
      const { orgId, userId, roles } = extractContext(req);
      const requestedStaffId = req.query.staff_id as string | undefined;
      const academicYearId = req.query.academic_year_id as string | undefined;

      const staff = await TeacherContextService.resolveTeacherStaff(
        orgId,
        userId,
        requestedStaffId,
        roles,
      );

      const data = await TeacherContextService.getTeacherDashboard(
        orgId,
        staff.staff_id,
        academicYearId,
      );

      return ResponseHelper.sendSuccess(res, data, undefined, 200);
    } catch (error: any) {
      if (error instanceof AcademicError) {
        return ResponseHelper.sendError(
          res,
          error.message,
          error.statusCode,
          error.code,
          error.details,
        );
      }
      return ResponseHelper.sendError(
        res,
        error.message || 'Internal server error',
        500,
        'INTERNAL_ERROR',
      );
    }
  }

  /**
   * GET /v1/academic/teacher/classes
   */
  static async getClasses(req: Request, res: Response) {
    try {
      const { orgId, userId, roles } = extractContext(req);
      const requestedStaffId = req.query.staff_id as string | undefined;
      const academicYearId = req.query.academic_year_id as string | undefined;

      const staff = await TeacherContextService.resolveTeacherStaff(
        orgId,
        userId,
        requestedStaffId,
        roles,
      );

      const classes = await TeacherContextService.getTeacherClasses(
        orgId,
        staff.staff_id,
        academicYearId,
      );

      return ResponseHelper.sendSuccess(res, classes, undefined, 200);
    } catch (error: any) {
      if (error instanceof AcademicError) {
        return ResponseHelper.sendError(
          res,
          error.message,
          error.statusCode,
          error.code,
          error.details,
        );
      }
      return ResponseHelper.sendError(
        res,
        error.message || 'Internal server error',
        500,
        'INTERNAL_ERROR',
      );
    }
  }

  /**
   * GET /v1/academic/teacher/subjects
   */
  static async getSubjects(req: Request, res: Response) {
    try {
      const { orgId, userId, roles } = extractContext(req);
      const requestedStaffId = req.query.staff_id as string | undefined;
      const academicYearId = req.query.academic_year_id as string | undefined;

      const staff = await TeacherContextService.resolveTeacherStaff(
        orgId,
        userId,
        requestedStaffId,
        roles,
      );

      const subjects = await TeacherContextService.getTeacherSubjects(
        orgId,
        staff.staff_id,
        academicYearId,
      );

      return ResponseHelper.sendSuccess(res, subjects, undefined, 200);
    } catch (error: any) {
      if (error instanceof AcademicError) {
        return ResponseHelper.sendError(
          res,
          error.message,
          error.statusCode,
          error.code,
          error.details,
        );
      }
      return ResponseHelper.sendError(
        res,
        error.message || 'Internal server error',
        500,
        'INTERNAL_ERROR',
      );
    }
  }

  /**
   * GET /v1/academic/teacher/timetable
   */
  static async getTimetable(req: Request, res: Response) {
    try {
      const { orgId, userId, roles } = extractContext(req);
      const requestedStaffId = req.query.staff_id as string | undefined;
      const academicYearId = req.query.academic_year_id as string | undefined;
      const weekday = req.query.weekday ? parseInt(req.query.weekday as string, 10) : undefined;

      const staff = await TeacherContextService.resolveTeacherStaff(
        orgId,
        userId,
        requestedStaffId,
        roles,
      );

      const timetable = await TeacherContextService.getTeacherSchedule(
        orgId,
        staff.staff_id,
        weekday,
        academicYearId,
      );

      return ResponseHelper.sendSuccess(res, timetable, undefined, 200);
    } catch (error: any) {
      if (error instanceof AcademicError) {
        return ResponseHelper.sendError(
          res,
          error.message,
          error.statusCode,
          error.code,
          error.details,
        );
      }
      return ResponseHelper.sendError(
        res,
        error.message || 'Internal server error',
        500,
        'INTERNAL_ERROR',
      );
    }
  }

  /**
   * GET /v1/academic/teacher/curriculum
   */
  static async getCurriculum(req: Request, res: Response) {
    try {
      const { orgId, userId, roles } = extractContext(req);
      const requestedStaffId = req.query.staff_id as string | undefined;
      const academicYearId = req.query.academic_year_id as string | undefined;

      const staff = await TeacherContextService.resolveTeacherStaff(
        orgId,
        userId,
        requestedStaffId,
        roles,
      );

      const curriculum = await TeacherContextService.getTeacherCurriculum(
        orgId,
        staff.staff_id,
        academicYearId,
      );

      return ResponseHelper.sendSuccess(res, curriculum, undefined, 200);
    } catch (error: any) {
      if (error instanceof AcademicError) {
        return ResponseHelper.sendError(
          res,
          error.message,
          error.statusCode,
          error.code,
          error.details,
        );
      }
      return ResponseHelper.sendError(
        res,
        error.message || 'Internal server error',
        500,
        'INTERNAL_ERROR',
      );
    }
  }

  /**
   * GET /v1/academic/teacher/lesson-plans
   */
  static async getLessonPlans(req: Request, res: Response) {
    try {
      const { orgId, userId, roles } = extractContext(req);
      const requestedStaffId = req.query.staff_id as string | undefined;
      const academicYearId = req.query.academic_year_id as string | undefined;

      const staff = await TeacherContextService.resolveTeacherStaff(
        orgId,
        userId,
        requestedStaffId,
        roles,
      );

      const lessonPlans = await TeacherContextService.getTeacherLessonPlans(
        orgId,
        staff.staff_id,
        academicYearId,
      );

      return ResponseHelper.sendSuccess(res, lessonPlans, undefined, 200);
    } catch (error: any) {
      if (error instanceof AcademicError) {
        return ResponseHelper.sendError(
          res,
          error.message,
          error.statusCode,
          error.code,
          error.details,
        );
      }
      return ResponseHelper.sendError(
        res,
        error.message || 'Internal server error',
        500,
        'INTERNAL_ERROR',
      );
    }
  }

  /**
   * GET /v1/academic/teacher/workload
   */
  static async getWorkload(req: Request, res: Response) {
    try {
      const { orgId, userId, roles } = extractContext(req);
      const requestedStaffId = req.query.staff_id as string | undefined;
      const academicYearId = req.query.academic_year_id as string | undefined;

      const staff = await TeacherContextService.resolveTeacherStaff(
        orgId,
        userId,
        requestedStaffId,
        roles,
      );

      const workload = await TeacherContextService.getTeacherWorkload(
        orgId,
        staff.staff_id,
        academicYearId,
      );

      return ResponseHelper.sendSuccess(res, workload, undefined, 200);
    } catch (error: any) {
      if (error instanceof AcademicError) {
        return ResponseHelper.sendError(
          res,
          error.message,
          error.statusCode,
          error.code,
          error.details,
        );
      }
      return ResponseHelper.sendError(
        res,
        error.message || 'Internal server error',
        500,
        'INTERNAL_ERROR',
      );
    }
  }
}
