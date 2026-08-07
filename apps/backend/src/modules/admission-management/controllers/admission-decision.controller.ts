import { Request, Response } from 'express';
import { AdmissionDecisionService } from '../services/admission.decision.service';
import { recordDecisionSchema } from '../dto/request/record-decision.dto';
import { ApplicationError } from '../errors/admission.errors';

export class AdmissionDecisionController {
  static async record(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = recordDecisionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await AdmissionDecisionService.recordDecision(id, userId, parsed.data);
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
      const result = await AdmissionDecisionService.getDecisionByApplication(id);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
