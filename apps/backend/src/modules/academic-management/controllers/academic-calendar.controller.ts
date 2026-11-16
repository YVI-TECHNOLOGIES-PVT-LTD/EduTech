import { Request, Response } from 'express';
import { AcademicCalendarService } from '../services/academic-calendar.service';
import { listCalendarEntriesSchema } from '../dto/request/calendar.dto';
import { AcademicError } from '../errors/academic.errors';
import { ResponseHelper } from '../utils/response.helper';

function extractOrgId(req: Request): string {
  const orgId =
    (req as any).context?.user?.org_id ||
    (req as any).context?.user?.school_id ||
    (req as any).tenantOrgId;
  if (!orgId) {
    throw new AcademicError('Tenant context is required', 401, 'UNAUTHORIZED');
  }
  return orgId;
}

export class AcademicCalendarController {
  /**
   * GET /v1/academic/calendar
   * Retrieve master calendar overview for active or specified academic year
   */
  static async getCalendar(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { academic_year_id } = req.query;
      const result = await AcademicCalendarService.getCalendar(
        orgId,
        academic_year_id as string | undefined,
      );
      return ResponseHelper.sendSuccess(res, result, undefined, 200);
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
   * GET /v1/academic/calendar/events
   * List paginated calendar entries with date range and event type filtering
   */
  static async listEntries(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const parsed = listCalendarEntriesSchema.safeParse(req.query);
      if (!parsed.success) {
        return ResponseHelper.sendError(
          res,
          'Validation failed for calendar entries query',
          400,
          'VALIDATION_FAILED',
          parsed.error.format(),
        );
      }

      const result = await AcademicCalendarService.listEntries(orgId, parsed.data);
      return ResponseHelper.sendSuccess(res, result.items, result.meta, 200);
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
   * GET /v1/academic/calendar/events/:id
   * Get calendar entry details with target grades
   */
  static async getEntryById(req: Request, res: Response) {
    try {
      const orgId = extractOrgId(req);
      const { id } = req.params;
      const result = await AcademicCalendarService.getEntryById(orgId, id);
      return ResponseHelper.sendSuccess(res, result, undefined, 200);
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
