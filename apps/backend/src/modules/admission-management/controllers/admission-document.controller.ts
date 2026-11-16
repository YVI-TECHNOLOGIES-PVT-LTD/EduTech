import { Request, Response } from 'express';
import prisma from '../../../lib/prismaClient';
import { AdmissionDocumentService } from '../services/admission.document.service';
import { uploadDocumentSchema } from '../dto/request/upload-document.dto';
import { verifyDocumentSchema } from '../dto/request/verify-document.dto';
import {
  ApplicationError,
  ApplicationValidationError,
  ApplicationForbiddenError,
} from '../errors/admission.errors';
import { validateFileBufferSignature } from '../../../middlewares/upload.middleware';
import { logger } from '../../../utils/logger';

export class AdmissionDocumentController {
  static async getDocumentTypes(req: Request, res: Response) {
    try {
      const user = (req as any).context?.user || (req as any).user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const userRoles = user?.roles || [];
      const isParentOnly =
        userRoles.includes('PARENT') &&
        !userRoles.some((r: string) =>
          ['SUPERADMIN', 'ADMIN', 'ADMISSION_OFFICER', 'FRONT_OFFICE', 'STAFF'].includes(r),
        );

      const applicationId =
        (req.query.application_id as string) ||
        (req.query.applicationId as string) ||
        (req.query.app_id as string);

      if (applicationId) {
        // Preferred contract: derive authoritative organization strictly from authorized application
        const result = await AdmissionDocumentService.getDocumentTypesForApplication(
          applicationId,
          userId,
          isParentOnly,
        );
        return res.json(result);
      }

      // Pre-application catalogue loading: Resolve trusted organization context
      const requestedOrgId = (req.query.org_id as string) || (req.query.school_id as string);
      let targetOrgId: string | undefined = undefined;

      if (requestedOrgId) {
        // Verify requested organization exists and is active
        const validOrg = await prisma.organizations.findFirst({
          where: { org_id: requestedOrgId, status: 'active' },
          select: { org_id: true },
        });

        if (!validOrg) {
          throw new ApplicationValidationError('Invalid or inactive organization requested');
        }

        // If authenticated user has fixed tenant (non-parent staff), prevent cross-tenant enumeration
        if (
          user?.org_id &&
          !isParentOnly &&
          user.org_id !== validOrg.org_id &&
          !userRoles.includes('SUPERADMIN')
        ) {
          throw new ApplicationForbiddenError(
            'Unauthorized to access document catalogue for another organization',
          );
        }

        targetOrgId = validOrg.org_id;
      } else if (user?.org_id) {
        targetOrgId = user.org_id;
      } else {
        const defaultOrg = await prisma.organizations.findFirst({
          where: { status: 'active' },
          orderBy: { created_at: 'asc' },
          select: { org_id: true },
        });
        targetOrgId = defaultOrg?.org_id;
      }

      if (!targetOrgId) {
        throw new ApplicationValidationError('Organization context could not be resolved');
      }

      const result = await AdmissionDocumentService.getDocumentTypes(targetOrgId);
      return res.json(result);
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        return res.status(error.statusCode).json({ error: error.message, code: error.code });
      }
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

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

      if (req.file) {
        validateFileBufferSignature(req.file);
      }

      const user = (req as any).context?.user || (req as any).user;
      const userRoles = user?.roles || [];
      const isParentOnly =
        userRoles.includes('PARENT') &&
        !userRoles.some((r: string) =>
          ['SUPERADMIN', 'ADMIN', 'ADMISSION_OFFICER', 'FRONT_OFFICE', 'STAFF'].includes(r),
        );
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const orgId = user?.org_id || user?.school_id;
      const result = await AdmissionDocumentService.uploadDocument(
        id,
        userId,
        parsed.data,
        req.file,
        orgId,
        isParentOnly,
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
      const user = (req as any).context?.user || (req as any).user;
      const orgId = user?.org_id || user?.school_id;
      const isOnlyParent =
        user?.roles?.includes('PARENT') &&
        !user?.roles?.some((r: string) =>
          ['ADMIN', 'FRONT_OFFICE', 'ADMISSION_OFFICER', 'STAFF', 'SUPERADMIN'].includes(r),
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
      const user = (req as any).context?.user || (req as any).user;
      const userId = user?.id || (req as any).user?.user_id || null;
      const orgId = user?.org_id || user?.school_id;
      const isOnlyParent =
        user?.roles?.includes('PARENT') &&
        !user?.roles?.some((r: string) =>
          ['ADMIN', 'FRONT_OFFICE', 'ADMISSION_OFFICER', 'STAFF', 'SUPERADMIN'].includes(r),
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

      const user = (req as any).context?.user || (req as any).user;
      const userId = user?.id || (req as any).user?.user_id || (req as any).user?.id || null;
      const orgId = user?.org_id || user?.school_id;
      const result = await AdmissionDocumentService.verifyDocument(
        id,
        userId,
        parsed.data,
        orgId,
        user,
      );
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
      const user = (req as any).context?.user || (req as any).user;
      const userId = user?.id || (req as any).user?.user_id || null;
      const orgId = user?.org_id || user?.school_id;
      const isOnlyParent =
        user?.roles?.includes('PARENT') &&
        !user?.roles?.some((r: string) =>
          ['ADMIN', 'FRONT_OFFICE', 'ADMISSION_OFFICER', 'STAFF', 'SUPERADMIN'].includes(r),
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
