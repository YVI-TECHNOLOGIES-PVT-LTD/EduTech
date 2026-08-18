import { Request, Response } from 'express';
import { AdmissionPaymentService } from '../services/admission.payment.service';
import { recordPaymentSchema } from '../dto/request/record-payment.dto';
import { ApplicationError } from '../errors/admission.errors';

export class AdmissionPaymentController {
  /**
   * GET /v1/applications/:id/fee
   * Fetch authoritative fee calculation and current payment state for an application.
   */
  static async getFee(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).context?.user || (req as any).user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const userRoles = user?.roles || [];
      const isOnlyParent =
        userRoles.includes('PARENT') &&
        !userRoles.some((r: string) =>
          ['SUPERADMIN', 'ADMIN', 'FRONT_OFFICE', 'ADMISSION_OFFICER', 'STAFF'].includes(r),
        );
      const orgId = user?.org_id || user?.school_id;

      const result = await AdmissionPaymentService.getApplicationFee(
        id,
        orgId,
        userId,
        isOnlyParent,
      );
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * GET /v1/applications/fee-config
   * Pre-application fee configuration retrieval.
   */
  static async getFeeConfig(req: Request, res: Response) {
    try {
      const requestedOrgId = (req.query.org_id as string) || (req.query.school_id as string);
      const academicYearId = (req.query.academic_year_id as string) || (req.query.ay_id as string);
      const result = await AdmissionPaymentService.getFeeConfig(requestedOrgId, academicYearId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * POST /v1/applications/:id/payment
   * Record / Settle Fee Payment for an Application.
   */
  static async record(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = recordPaymentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const user = (req as any).context?.user || (req as any).user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const userRoles = user?.roles || [];
      const isOnlyParent =
        userRoles.includes('PARENT') &&
        !userRoles.some((r: string) =>
          ['SUPERADMIN', 'ADMIN', 'FRONT_OFFICE', 'ADMISSION_OFFICER', 'STAFF'].includes(r),
        );
      const orgId = user?.org_id || user?.school_id;

      const result = await AdmissionPaymentService.recordPayment(
        id,
        userId,
        parsed.data,
        orgId,
        isOnlyParent,
      );
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  /**
   * GET /v1/applications/:id/payment
   * Get existing payment record for an application.
   */
  static async getByApplicationId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).context?.user || (req as any).user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const userRoles = user?.roles || [];
      const isOnlyParent =
        userRoles.includes('PARENT') &&
        !userRoles.some((r: string) =>
          ['SUPERADMIN', 'ADMIN', 'FRONT_OFFICE', 'ADMISSION_OFFICER', 'STAFF'].includes(r),
        );
      const orgId = user?.org_id || user?.school_id;

      const result = await AdmissionPaymentService.getPaymentByApplication(
        id,
        orgId,
        userId,
        isOnlyParent,
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
