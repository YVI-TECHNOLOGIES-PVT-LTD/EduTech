import { Request, Response } from 'express';
import { StudentAcademicsService } from '../services/student-academics.service';
import { StudentError } from '../errors/student.errors';
import { ParentError } from '../../parent-management/errors/parent.errors';

export class StudentAcademicsController {
  private static extractAuth(req: Request) {
    const user = (req as any).context?.user || (req as any).user;
    const orgId = user?.org_id || user?.school_id || (req.query.org_id as string) || undefined;
    return { user, orgId };
  }

  private static handleError(error: any, res: Response) {
    if (error instanceof ParentError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.code,
        message: error.message,
      });
    }
    if (error instanceof StudentError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.code,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Internal server error',
    });
  }

  static async getExams(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user, orgId } = StudentAcademicsController.extractAuth(req);
      const data = await StudentAcademicsService.getExams(id, user, orgId);
      return res.json({ success: true, data });
    } catch (error: any) {
      return StudentAcademicsController.handleError(error, res);
    }
  }

  static async getAttendanceSummary(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const month = req.query.month as string | undefined;
      const { user, orgId } = StudentAcademicsController.extractAuth(req);
      const data = await StudentAcademicsService.getAttendanceSummary(id, user, orgId, month);
      return res.json({ success: true, data });
    } catch (error: any) {
      return StudentAcademicsController.handleError(error, res);
    }
  }

  static async getAttendanceTimeline(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user, orgId } = StudentAcademicsController.extractAuth(req);
      const data = await StudentAcademicsService.getAttendanceTimeline(id, user, orgId);
      return res.json({ success: true, data });
    } catch (error: any) {
      return StudentAcademicsController.handleError(error, res);
    }
  }

  static async getTodayTimetable(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user, orgId } = StudentAcademicsController.extractAuth(req);
      const data = await StudentAcademicsService.getTodayTimetable(id, user, orgId);
      return res.json({ success: true, data });
    } catch (error: any) {
      return StudentAcademicsController.handleError(error, res);
    }
  }

  static async getWeekTimetable(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user, orgId } = StudentAcademicsController.extractAuth(req);
      const data = await StudentAcademicsService.getWeekTimetable(id, user, orgId);
      return res.json({ success: true, data });
    } catch (error: any) {
      return StudentAcademicsController.handleError(error, res);
    }
  }

  static async getHomework(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user, orgId } = StudentAcademicsController.extractAuth(req);
      const data = await StudentAcademicsService.getHomework(id, user, orgId);
      return res.json({ success: true, data });
    } catch (error: any) {
      return StudentAcademicsController.handleError(error, res);
    }
  }

  static async getResults(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const term = req.query.term as string | undefined;
      const { user, orgId } = StudentAcademicsController.extractAuth(req);
      const data = await StudentAcademicsService.getResults(id, user, orgId, term);
      return res.json({ success: true, data });
    } catch (error: any) {
      return StudentAcademicsController.handleError(error, res);
    }
  }

  static async getTransport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user, orgId } = StudentAcademicsController.extractAuth(req);
      const data = await StudentAcademicsService.getTransport(id, user, orgId);
      return res.json({ success: true, data });
    } catch (error: any) {
      return StudentAcademicsController.handleError(error, res);
    }
  }

  static async getLibrary(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user, orgId } = StudentAcademicsController.extractAuth(req);
      const data = await StudentAcademicsService.getLibrary(id, user, orgId);
      return res.json({ success: true, data });
    } catch (error: any) {
      return StudentAcademicsController.handleError(error, res);
    }
  }

  static async getLibraryHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { user, orgId } = StudentAcademicsController.extractAuth(req);
      const data = await StudentAcademicsService.getLibraryHistory(id, user, orgId);
      return res.json({ success: true, data });
    } catch (error: any) {
      return StudentAcademicsController.handleError(error, res);
    }
  }
}
