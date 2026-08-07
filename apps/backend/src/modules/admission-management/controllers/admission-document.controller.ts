import { Request, Response } from 'express';
import { AdmissionDocumentService } from '../services/admission.document.service';
import { uploadDocumentSchema } from '../dto/request/upload-document.dto';
import { verifyDocumentSchema } from '../dto/request/verify-document.dto';
import { ApplicationError } from '../errors/admission.errors';

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

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await AdmissionDocumentService.uploadDocument(id, userId, parsed.data);
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
      const result = await AdmissionDocumentService.getDocumentsByApplication(id);
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

      const userId = (req as any).user?.user_id || (req as any).user?.id || null;
      const result = await AdmissionDocumentService.verifyDocument(id, userId, parsed.data);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
