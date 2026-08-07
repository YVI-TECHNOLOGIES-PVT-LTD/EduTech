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

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await AdmissionAssessmentService.recordAssessment(id, userId, parsed.data);
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
      const result = await AdmissionAssessmentService.getAssessmentByApplication(id);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
