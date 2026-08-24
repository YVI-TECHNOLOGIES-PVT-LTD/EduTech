import { Request, Response } from 'express';
import { AdmissionAssessmentService } from '../services/admission.assessment.service';
import { recordAssessmentSchema } from '../dto/request/record-assessment.dto';
import { ApplicationError } from '../errors/admission.errors';

export class AdmissionAssessmentController {
  static async record(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = recordAssessmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const user = (req as any).context?.user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const orgId = user?.org_id || user?.school_id;
      const result = await AdmissionAssessmentService.recordAssessment(
        id,
        userId,
        parsed.data,
        orgId,
      );
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getByApplicationId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).context?.user || (req as any).user;
      const userId = user?.id || user?.user_id || null;
      const userRoles = user?.roles || [];
      const isOnlyParent =
        userRoles.includes('PARENT') &&
        !userRoles.some((r: string) =>
          ['SUPERADMIN', 'ADMIN', 'FRONT_OFFICE', 'ADMISSION_OFFICER', 'STAFF'].includes(r),
        );
      const orgId = user?.org_id || user?.school_id;
      const parentUserId = isOnlyParent ? userId : undefined;

      const result = await AdmissionAssessmentService.getAssessmentByApplication(
        id,
        orgId,
        parentUserId,
      );
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async listAssessments(req: Request, res: Response) {
    try {
      const user = (req as any).context?.user;
      const orgId = (req.query.org_id as string) || user?.org_id || user?.school_id;
      const academicYearId = req.query.academic_year_id as string;
      const gradeId = req.query.grade_id as string;
      const resultFilter = req.query.result as string;
      const searchText = (req.query.search || req.query.searchText) as string;
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize || req.query.limit) || 20;

      const result = await AdmissionAssessmentService.listAssessments({
        orgId,
        academicYearId,
        gradeId,
        result: resultFilter,
        searchText,
        page,
        pageSize,
      });

      return res.json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getConfigs(req: Request, res: Response) {
    try {
      const user = (req as any).context?.user;
      const orgId = (req.query.org_id as string) || user?.org_id || user?.school_id;
      const result = await AdmissionAssessmentService.getAssessmentConfigs(orgId);
      return res.json({ data: result });
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async upsertConfig(req: Request, res: Response) {
    try {
      const user = (req as any).context?.user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const { academic_year_grade_id, ...configData } = req.body;

      if (!academic_year_grade_id) {
        return res.status(400).json({ error: 'academic_year_grade_id is required' });
      }

      const result = await AdmissionAssessmentService.upsertAssessmentConfig(
        academic_year_grade_id,
        configData,
        userId,
      );

      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getAnalytics(req: Request, res: Response) {
    try {
      const user = (req as any).context?.user;
      const orgId = (req.query.org_id as string) || user?.org_id || user?.school_id;
      const result = await AdmissionAssessmentService.getAssessmentAnalytics(orgId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
