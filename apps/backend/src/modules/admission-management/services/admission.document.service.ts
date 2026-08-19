import prisma from '../../../lib/prismaClient';
import { AdmissionDocumentRepository } from '../repositories/admission.document.repository';
import { AdmissionRepository } from '../repositories/admission.repository';
import {
  ApplicationNotFoundError,
  DocumentNotFoundError,
  ApplicationValidationError,
  ApplicationForbiddenError,
} from '../errors/admission.errors';
import { UploadDocumentDto } from '../dto/request/upload-document.dto';
import { VerifyDocumentDto } from '../dto/request/verify-document.dto';
import { AdmissionEvents, ApplicationEventType } from '../events/admission.events';
import { StorageService } from '../../../services/storage.service';
import { AdmissionMapper } from '../mappers/admission.mapper';
import { logger } from '../../../utils/logger';
import crypto from 'crypto';

export class AdmissionDocumentService {
  static async getDocumentTypes(orgId: string) {
    if (!orgId) {
      throw new ApplicationValidationError('Organization ID is required to fetch document types');
    }
    return prisma.document_types.findMany({
      where: {
        org_id: orgId,
        is_active: true,
      },
      orderBy: { display_order: 'asc' },
    });
  }

  static async getDocumentTypesForApplication(
    applicationId: string,
    userId?: string | null,
    isParentOnly?: boolean,
  ) {
    const app = await AdmissionRepository.findById(
      applicationId,
      undefined,
      isParentOnly ? userId || undefined : undefined,
    );
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    return AdmissionDocumentService.getDocumentTypes(app.org_id);
  }

  static async uploadDocument(
    applicationId: string,
    createdBy: string | null,
    dto: UploadDocumentDto,
    file?: Express.Multer.File,
    orgId?: string,
    isParentOnly?: boolean,
  ) {
    const app = await AdmissionRepository.findById(
      applicationId,
      orgId,
      isParentOnly ? createdBy || undefined : undefined,
    );
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    // Authoritative organization is strictly derived from the verified application record
    const authoritativeOrgId = app.org_id;
    const documentId = crypto.randomUUID();
    let storagePath = dto.file_path || '';

    const isUuid = (str?: string) =>
      !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    let targetDocTypeId = dto.document_type_id;
    const docCode = dto.document_code || dto.document_type || dto.document_type_code;

    if (isUuid(targetDocTypeId)) {
      // Validate that document_type exists, is active, AND strictly belongs to authoritativeOrgId
      const docTypeRecord = await prisma.document_types.findFirst({
        where: {
          document_type_id: targetDocTypeId,
          org_id: authoritativeOrgId,
          is_active: true,
        },
      });

      if (!docTypeRecord) {
        // Check if document type exists in another organization for security violation logging
        const existsElsewhere = await prisma.document_types.findUnique({
          where: { document_type_id: targetDocTypeId },
          select: { org_id: true, is_active: true },
        });

        if (existsElsewhere) {
          logger.warn(
            `[Security Alert] Cross-organization document upload rejected: Application ${applicationId} belongs to org ${authoritativeOrgId}, but document_type_id ${targetDocTypeId} belongs to org ${existsElsewhere.org_id}`,
          );
          throw new ApplicationForbiddenError(
            'Document type does not belong to the application organization or is inactive',
          );
        }

        throw new ApplicationValidationError(
          `Document type ${targetDocTypeId} not found or inactive for organization ${authoritativeOrgId}`,
        );
      }
    } else if (docCode) {
      // Name/code lookup scoped strictly to authoritativeOrgId
      const docNameMap: Record<string, string> = {
        aadhaar_card: "Student's Aadhaar Card",
        birth_certificate: 'Birth Certificate',
        passport_photo: "Student's Photo",
        academic_records: 'Previous Academic Records',
      };
      const documentName = docNameMap[docCode] || docCode;

      let docTypeRecord = await prisma.document_types.findFirst({
        where: {
          org_id: authoritativeOrgId,
          is_active: true,
          OR: [
            { document_name: { equals: documentName, mode: 'insensitive' } },
            { document_name: { equals: docCode, mode: 'insensitive' } },
          ],
        },
      });

      if (!docTypeRecord) {
        docTypeRecord = await prisma.document_types.create({
          data: {
            org_id: authoritativeOrgId,
            document_name: documentName,
            description: `Document for ${documentName}`,
            is_mandatory: false,
            is_active: true,
          },
        });
      }

      targetDocTypeId = docTypeRecord.document_type_id;
    } else {
      throw new ApplicationValidationError('Valid document_type_id or document_code is required');
    }

    const finalDocTypeId: string = targetDocTypeId!;

    // Capture old storage path if replacing an existing document for this application & document_type
    let oldStoragePath: string | null = null;
    const existingDoc = await prisma.admission_documents.findUnique({
      where: {
        application_id_document_type_id: {
          application_id: applicationId,
          document_type_id: finalDocTypeId,
        },
      },
    });
    if (existingDoc) {
      oldStoragePath = existingDoc.storage_path;
    }

    // Handle binary file upload with strictly authoritative application.org_id in storage path
    if (file) {
      const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      storagePath = `${authoritativeOrgId}/${applicationId}/${documentId}/${safeFileName}`;

      try {
        await StorageService.uploadFile({
          path: storagePath,
          buffer: file.buffer,
          mimeType: file.mimetype,
        });
      } catch (err: any) {
        logger.error(`Binary upload to Supabase Storage failed for application ${applicationId}`, {
          error: err.message,
        });
        throw new ApplicationValidationError(`Failed to upload document binary: ${err.message}`);
      }
    }

    if (!storagePath) {
      throw new ApplicationValidationError('File binary or storage_path is required');
    }

    let doc: any;
    try {
      doc = await AdmissionDocumentRepository.create(applicationId, createdBy, {
        document_type_id: finalDocTypeId,
        storage_path: storagePath,
        original_file_name: file ? file.originalname : undefined,
        mime_type: file ? file.mimetype : undefined,
        file_size: file ? file.size : undefined,
      });
    } catch (dbErr: any) {
      // Compensating Storage Cleanup: If DB insert fails after storage upload, clean up new binary!
      if (file && storagePath) {
        try {
          await StorageService.deleteFile(storagePath);
        } catch (cleanupErr: any) {
          logger.warn(
            `Failed to clean up newly uploaded storage binary on DB failure: ${cleanupErr.message}`,
          );
        }
      }
      throw dbErr;
    }

    // Compensating Storage Cleanup: On successful replacement, clean up old storage object
    if (oldStoragePath && oldStoragePath !== storagePath) {
      try {
        await StorageService.deleteFile(oldStoragePath);
        logger.info(`Old storage file cleaned up on replacement: ${oldStoragePath}`);
      } catch (cleanErr: any) {
        logger.warn(
          `Failed to clean up old storage file ${oldStoragePath} on replacement: ${cleanErr.message}`,
        );
      }
    }

    logger.info(
      `Document uploaded successfully for application ${applicationId}: ${doc.document_id}`,
      {
        applicationId,
        documentId: doc.document_id,
        storagePath,
        createdBy,
      },
    );

    await AdmissionEvents.publish(ApplicationEventType.DOCUMENT_UPLOADED, {
      applicationId,
      performedBy: createdBy,
      timestamp: new Date().toISOString(),
      metadata: { documentId: doc.document_id, verifyStatus: doc.verify_status },
    });

    return {
      ...doc,
      file_size:
        doc.file_size !== null && doc.file_size !== undefined ? Number(doc.file_size) : null,
    };
  }

  static async getDocumentsByApplication(
    applicationId: string,
    orgId?: string,
    parentUserId?: string,
  ) {
    const app = await AdmissionRepository.findById(applicationId, orgId, parentUserId);
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    return AdmissionDocumentRepository.findByApplicationId(applicationId);
  }

  static async getSignedUrl(
    documentId: string,
    userId: string | null,
    orgId?: string,
    isParentOnly?: boolean,
  ) {
    const existing = await AdmissionDocumentRepository.findById(documentId);
    if (!existing) {
      throw new DocumentNotFoundError(documentId);
    }

    if (
      orgId &&
      existing.admissions_applications &&
      existing.admissions_applications.org_id !== orgId
    ) {
      throw new DocumentNotFoundError(documentId);
    }

    if (isParentOnly && userId) {
      const parentUserMatches =
        existing.admissions_applications?.leads?.parents?.user_id === userId ||
        existing.admissions_applications?.created_by === userId ||
        existing.admissions_applications?.leads?.created_by === userId;
      if (!parentUserMatches) {
        throw new DocumentNotFoundError(documentId);
      }
    }

    if (
      !existing.storage_path ||
      typeof existing.storage_path !== 'string' ||
      !existing.storage_path.trim()
    ) {
      throw new ApplicationValidationError(
        'Document record does not contain a valid storage reference',
      );
    }

    const result = await StorageService.getSignedUrl({
      path: existing.storage_path,
      expiresInSeconds: 3600,
    });

    const mappedDocument = AdmissionMapper.toDocumentResponseDto(existing);

    return {
      document_id: existing.document_id,
      application_id: existing.application_id,
      signed_url: result.signedUrl,
      expires_at: result.expiresAt,
      document: mappedDocument,
    };
  }

  static async verifyDocument(
    documentId: string,
    verifiedBy: string | null,
    dto: VerifyDocumentDto,
    orgId?: string,
    userContext?: any,
  ) {
    const userRoles = userContext?.roles || [];
    const userPermissions = userContext?.permissions || [];
    const isParent =
      userRoles.includes('PARENT') &&
      !userRoles.some((r: string) =>
        ['SUPERADMIN', 'ADMIN', 'ADMISSION_OFFICER', 'FRONT_OFFICE', 'STAFF'].includes(r),
      );
    const hasVerifyPermission =
      userRoles.includes('SUPERADMIN') ||
      userPermissions.includes('admission.review') ||
      userPermissions.includes('admission.leads.manage');

    if (isParent || !hasVerifyPermission) {
      throw new ApplicationForbiddenError(
        'You are not authorized to verify or alter document verification status',
      );
    }

    const existing = await AdmissionDocumentRepository.findById(documentId);
    if (!existing) {
      throw new DocumentNotFoundError(documentId);
    }

    if (
      orgId &&
      existing.admissions_applications &&
      existing.admissions_applications.org_id !== orgId
    ) {
      throw new DocumentNotFoundError(documentId);
    }

    const doc = await AdmissionDocumentRepository.verify(documentId, verifiedBy, dto);

    logger.info(`Document ${documentId} verified as ${doc.verify_status}`, {
      documentId,
      applicationId: doc.application_id,
      verifiedBy,
    });

    await AdmissionEvents.publish(ApplicationEventType.DOCUMENT_VERIFIED, {
      applicationId: doc.application_id,
      performedBy: verifiedBy,
      timestamp: new Date().toISOString(),
      metadata: { documentId: doc.document_id, verifyStatus: doc.verify_status },
    });

    return doc;
  }

  static async deleteDocument(
    documentId: string,
    userId: string | null,
    orgId?: string,
    isParentOnly?: boolean,
  ) {
    const existing = await AdmissionDocumentRepository.findById(documentId);
    if (!existing) {
      throw new DocumentNotFoundError(documentId);
    }

    if (
      orgId &&
      existing.admissions_applications &&
      existing.admissions_applications.org_id !== orgId
    ) {
      throw new DocumentNotFoundError(documentId);
    }

    if (isParentOnly && userId) {
      const parentUserMatches =
        existing.admissions_applications?.leads?.parents?.user_id === userId ||
        existing.admissions_applications?.created_by === userId ||
        existing.admissions_applications?.leads?.created_by === userId;
      if (!parentUserMatches) {
        throw new DocumentNotFoundError(documentId);
      }
    }

    if (existing.storage_path) {
      try {
        await StorageService.deleteFile(existing.storage_path);
      } catch (cleanErr: any) {
        logger.warn(
          `Failed to clean up storage binary ${existing.storage_path} on document deletion: ${cleanErr.message}`,
        );
      }
    }

    return AdmissionDocumentRepository.delete(documentId);
  }
}
