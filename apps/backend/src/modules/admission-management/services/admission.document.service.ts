import prisma from '../../../lib/prismaClient';
import { AdmissionDocumentRepository } from '../repositories/admission.document.repository';
import { AdmissionRepository } from '../repositories/admission.repository';
import {
  ApplicationNotFoundError,
  DocumentNotFoundError,
  ApplicationValidationError,
} from '../errors/admission.errors';
import { UploadDocumentDto } from '../dto/request/upload-document.dto';
import { VerifyDocumentDto } from '../dto/request/verify-document.dto';
import { AdmissionEvents, ApplicationEventType } from '../events/admission.events';
import { StorageService } from '../../../services/storage.service';
import { logger } from '../../../utils/logger';
import crypto from 'crypto';

export class AdmissionDocumentService {
  static async uploadDocument(
    applicationId: string,
    createdBy: string | null,
    dto: UploadDocumentDto,
    file?: Express.Multer.File,
    orgId?: string,
  ) {
    const isParentOnly = createdBy ? true : false;
    const app = await AdmissionRepository.findById(
      applicationId,
      orgId,
      isParentOnly ? createdBy || undefined : undefined,
    );
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    const documentId = crypto.randomUUID();
    let storagePath = dto.file_path || '';

    // Handle binary file upload if Express.Multer.File is attached
    if (file) {
      const safeOrgId = orgId || app.org_id;
      const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      storagePath = `${safeOrgId}/${applicationId}/${documentId}/${safeFileName}`;

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

    const isUuid = (str?: string) =>
      !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    let targetDocTypeId = dto.document_type_id;
    const docCode = dto.document_code || dto.document_type || dto.document_type_id;
    const targetOrgId = orgId || app.org_id;

    if (!isUuid(targetDocTypeId) && docCode) {
      const docNameMap: Record<string, string> = {
        aadhaar_card: "Student's Aadhaar Card",
        birth_certificate: 'Birth Certificate',
        passport_photo: "Student's Photo",
        academic_records: 'Previous Academic Records',
      };
      const documentName = docNameMap[docCode] || docCode;

      let docTypeRecord = await prisma.document_types.findFirst({
        where: {
          org_id: targetOrgId,
          OR: [
            { document_name: { equals: documentName, mode: 'insensitive' } },
            { document_name: { equals: docCode, mode: 'insensitive' } },
          ],
        },
      });

      if (!docTypeRecord) {
        docTypeRecord = await prisma.document_types.create({
          data: {
            org_id: targetOrgId,
            document_name: documentName,
            description: `Document for ${documentName}`,
            is_mandatory: false,
          },
        });
      }

      targetDocTypeId = docTypeRecord.document_type_id;
    }

    if (!targetDocTypeId || !isUuid(targetDocTypeId)) {
      throw new ApplicationValidationError('Valid document_type_id or document_code is required');
    }

    let doc: any;
    try {
      doc = await AdmissionDocumentRepository.create(applicationId, createdBy, {
        document_type_id: targetDocTypeId,
        storage_path: storagePath,
        original_file_name: file ? file.originalname : undefined,
        mime_type: file ? file.mimetype : undefined,
        file_size: file ? file.size : undefined,
      });
    } catch (dbErr: any) {
      // Storage Cleanup: If DB insert fails after storage upload, clean up orphaned binary!
      if (file && storagePath) {
        await StorageService.deleteFile(storagePath);
      }
      throw dbErr;
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

    return doc;
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

    if (
      isParentOnly &&
      existing.admissions_applications &&
      existing.admissions_applications.created_by !== userId
    ) {
      throw new DocumentNotFoundError(documentId);
    }

    const result = await StorageService.getSignedUrl({
      path: existing.storage_path,
      expiresInSeconds: 3600,
    });

    return {
      document_id: existing.document_id,
      application_id: existing.application_id,
      signed_url: result.signedUrl,
      expires_at: result.expiresAt,
      document: existing,
    };
  }

  static async verifyDocument(
    documentId: string,
    verifiedBy: string | null,
    dto: VerifyDocumentDto,
    orgId?: string,
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

    if (
      isParentOnly &&
      existing.admissions_applications &&
      existing.admissions_applications.created_by !== userId
    ) {
      throw new DocumentNotFoundError(documentId);
    }

    if (existing.storage_path) {
      await StorageService.deleteFile(existing.storage_path);
    }

    return AdmissionDocumentRepository.delete(documentId);
  }
}
