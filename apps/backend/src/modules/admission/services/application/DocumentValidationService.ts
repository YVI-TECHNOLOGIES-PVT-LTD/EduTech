import { MimeValidator } from './validators/MimeValidator';
import { ExtensionValidator } from './validators/ExtensionValidator';
import { FileSizeValidator } from './validators/FileSizeValidator';
import { DuplicateDocumentValidator } from './validators/DuplicateDocumentValidator';
import { VirusScanValidator } from './validators/VirusScanValidator';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { DocumentTypeRepository } from '../../repositories/application/DocumentTypeRepository';
import { NotFoundError } from '../../errors/NotFoundError';
import { BusinessRuleError } from '../../errors/BusinessRuleError';

export class DocumentValidationService {
    constructor(
        private readonly appRepo: ApplicationRepository,
        private readonly typeRepo: DocumentTypeRepository,
        private readonly mimeVal: MimeValidator,
        private readonly extVal: ExtensionValidator,
        private readonly sizeVal: FileSizeValidator,
        private readonly dupVal: DuplicateDocumentValidator,
        private readonly virusVal: VirusScanValidator
    ) {}

    /**
     * Runs full sequential validation filters on document uploads.
     */
    public async validateUpload(
        applicationId: string,
        docTypeCode: string,
        fileBuffer: Buffer,
        originalFilename: string,
        mimeType: string,
        fileSize: number,
        checksum: string,
        excludeDocId?: string
    ): Promise<any> {
        // 1. Verify Application exists
        const application = await this.appRepo.findById(applicationId);
        if (!application) {
            throw new NotFoundError(`Application with ID ${applicationId} not found`);
        }

        // 2. Verify Document Type exists and is active
        const docType = await this.typeRepo.findByCode(docTypeCode);
        if (!docType) {
            throw new NotFoundError(`Document Type with code "${docTypeCode}" not found or inactive`);
        }

        // 3. Verify Mime Type & Magic Bytes Binary Signature
        this.mimeVal.validate(mimeType, docType.allowed_mime_types, fileBuffer);

        // 4. Verify Extension
        const extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
        this.extVal.validate(extension, docType.allowed_extensions);

        // 5. Verify File Size
        this.sizeVal.validate(fileSize, docType.max_file_size);

        // 6. Verify Checksum duplicates
        await this.dupVal.validate(checksum, excludeDocId);

        // 7. Verify Security scan
        await this.virusVal.validate(fileBuffer);

        return docType;
    }
}
