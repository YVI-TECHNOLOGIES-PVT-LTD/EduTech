import { UploadDocumentDto } from '../dto/request/upload-document.dto';
import { VerifyDocumentDto } from '../dto/request/verify-document.dto';
import { ApplicationValidationError } from '../errors/admission.errors';

export class DocumentValidator {
  static validateUpload(dto: UploadDocumentDto): void {
    if (!dto.document_type_id) {
      throw new ApplicationValidationError('Document type ID is required');
    }
    if (!dto.file_path || dto.file_path.trim().length === 0) {
      throw new ApplicationValidationError('File path or storage key is required');
    }
  }

  static validateVerify(dto: VerifyDocumentDto): void {
    if (!dto.verify_status) {
      throw new ApplicationValidationError('Verify status is required');
    }
  }
}
