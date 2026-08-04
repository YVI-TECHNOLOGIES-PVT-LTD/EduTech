"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentValidationService = void 0;
const NotFoundError_1 = require("../../errors/NotFoundError");
class DocumentValidationService {
    constructor(appRepo, typeRepo, mimeVal, extVal, sizeVal, dupVal, virusVal) {
        this.appRepo = appRepo;
        this.typeRepo = typeRepo;
        this.mimeVal = mimeVal;
        this.extVal = extVal;
        this.sizeVal = sizeVal;
        this.dupVal = dupVal;
        this.virusVal = virusVal;
    }
    /**
     * Runs full sequential validation filters on document uploads.
     */
    async validateUpload(applicationId, docTypeCode, fileBuffer, originalFilename, mimeType, fileSize, checksum, excludeDocId) {
        // 1. Verify Application exists
        const application = await this.appRepo.findById(applicationId);
        if (!application) {
            throw new NotFoundError_1.NotFoundError(`Application with ID ${applicationId} not found`);
        }
        // 2. Verify Document Type exists and is active
        const docType = await this.typeRepo.findByCode(docTypeCode);
        if (!docType) {
            throw new NotFoundError_1.NotFoundError(`Document Type with code "${docTypeCode}" not found or inactive`);
        }
        // 3. Verify Mime Type
        this.mimeVal.validate(mimeType, docType.allowed_mime_types);
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
exports.DocumentValidationService = DocumentValidationService;
