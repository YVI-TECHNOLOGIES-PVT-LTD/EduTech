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

      const user = (req as any).context?.user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const orgId = user?.org_id || user?.school_id;
      const result = await AdmissionDecisionService.recordDecision(id, userId, parsed.data, orgId);
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

      const result = await AdmissionDecisionService.getDecisionByApplication(
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
}
