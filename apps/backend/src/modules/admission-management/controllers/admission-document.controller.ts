import { Request, Response } from 'express';
import { AdmissionDocumentService } from '../services/admission.document.service';
import { uploadDocumentSchema } from '../dto/request/upload-document.dto';
import { verifyDocumentSchema } from '../dto/request/verify-document.dto';
import { ApplicationError } from '../errors/admission.errors';

import { logger } from '../../../utils/logger';

export class AdmissionDocumentController {
  static async upload(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = uploadDocumentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const user = req.context?.user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const orgId = user?.org_id || user?.school_id;
      const result = await AdmissionDocumentService.uploadDocument(
        id,
        userId,
        parsed.data,
        req.file,
        orgId,
      );
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      logger.error('[AdmissionDocumentController.upload] Unhandled error during document upload:', {
        error: error.message,
        stack: error.stack,
        applicationId: req.params.id,
      });
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async getByApplicationId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.context?.user;
      const orgId = user?.org_id || user?.school_id;
      const isOnlyParent =
        user?.roles?.includes('PARENT') &&
        !user?.roles?.some((r) =>
          ['ADMIN', 'FRONT_OFFICE', 'ADMISSION_OFFICER', 'STAFF'].includes(r),
        );
      const parentUserId = isOnlyParent ? user?.id : undefined;

      const result = await AdmissionDocumentService.getDocumentsByApplication(
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

  static async getSignedUrl(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.context?.user;
      const userId = user?.id || (req as any).user?.user_id || null;
      const orgId = user?.org_id || user?.school_id;
      const isOnlyParent =
        user?.roles?.includes('PARENT') &&
        !user?.roles?.some((r) =>
          ['ADMIN', 'FRONT_OFFICE', 'ADMISSION_OFFICER', 'STAFF'].includes(r),
        );

      const result = await AdmissionDocumentService.getSignedUrl(id, userId, orgId, isOnlyParent);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async verify(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parsed = verifyDocumentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parsed.error.format(),
        });
      }

      const user = req.context?.user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const orgId = user?.org_id || user?.school_id;
      const result = await AdmissionDocumentService.verifyDocument(id, userId, parsed.data, orgId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = req.context?.user;
      const userId = user?.id || (req as any).user?.user_id || null;
      const orgId = user?.org_id || user?.school_id;
      const isOnlyParent =
        user?.roles?.includes('PARENT') &&
        !user?.roles?.some((r) =>
          ['ADMIN', 'FRONT_OFFICE', 'ADMISSION_OFFICER', 'STAFF'].includes(r),
        );

      await AdmissionDocumentService.deleteDocument(id, userId, orgId, isOnlyParent);
      return res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
