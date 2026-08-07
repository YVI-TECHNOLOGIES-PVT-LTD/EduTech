import { AdmissionDocumentRepository } from '../repositories/admission.document.repository';
import { AdmissionRepository } from '../repositories/admission.repository';
import { ApplicationNotFoundError, DocumentNotFoundError } from '../errors/admission.errors';
import { DocumentValidator } from '../validators/document.validator';
import { UploadDocumentDto } from '../dto/request/upload-document.dto';
import { VerifyDocumentDto } from '../dto/request/verify-document.dto';
import { AdmissionEvents, ApplicationEventType } from '../events/admission.events';
import { logger } from '../../../utils/logger';

export class AdmissionDocumentService {
  static async uploadDocument(applicationId: string, createdBy: string | null, dto: UploadDocumentDto) {
    const app = await AdmissionRepository.findById(applicationId);
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    DocumentValidator.validateUpload(dto);

    const doc = await AdmissionDocumentRepository.create(applicationId, createdBy, dto);

    logger.info(`Document metadata uploaded for application ${applicationId}: ${doc.document_id}`, {
      applicationId,
      documentId: doc.document_id,
      createdBy,
    });

    // Post-commit event emission
    await AdmissionEvents.publish(ApplicationEventType.DOCUMENT_UPLOADED, {
      applicationId,
      performedBy: createdBy,
      timestamp: new Date().toISOString(),
      metadata: { documentId: doc.document_id, verifyStatus: doc.verify_status },
    });

    return doc;
  }

  static async getDocumentsByApplication(applicationId: string) {
    const app = await AdmissionRepository.findById(applicationId);
    if (!app) {
      throw new ApplicationNotFoundError(applicationId);
    }

    return AdmissionDocumentRepository.findByApplicationId(applicationId);
  }

  static async verifyDocument(documentId: string, verifiedBy: string | null, dto: VerifyDocumentDto) {
    const existing = await AdmissionDocumentRepository.findById(documentId);
    if (!existing) {
      throw new DocumentNotFoundError(documentId);
    }

    DocumentValidator.validateVerify(dto);

    const doc = await AdmissionDocumentRepository.verify(documentId, verifiedBy, dto);

    logger.info(`Document ${documentId} verified as ${doc.verify_status}`, {
      documentId,
      applicationId: doc.application_id,
      verifiedBy,
    });

    // Post-commit event emission
    await AdmissionEvents.publish(ApplicationEventType.DOCUMENT_VERIFIED, {
      applicationId: doc.application_id,
      performedBy: verifiedBy,
      timestamp: new Date().toISOString(),
      metadata: { documentId: doc.document_id, verifyStatus: doc.verify_status },
    });

    return doc;
  }
}
