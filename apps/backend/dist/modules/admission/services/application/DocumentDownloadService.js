"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentDownloadService = void 0;
const BaseService_1 = require("../BaseService");
const NotFoundError_1 = require("../../errors/NotFoundError");
class DocumentDownloadService extends BaseService_1.BaseService {
    constructor(docRepo, signedUrlService, auditService) {
        super();
        this.docRepo = docRepo;
        this.signedUrlService = signedUrlService;
        this.auditService = auditService;
    }
    /**
     * Generates a signed read URL for an application document.
     */
    async getSignedDownloadUrl(id, requestedBy, expiresInSeconds = 3600, correlationId) {
        const doc = await this.docRepo.findById(id);
        if (!doc) {
            throw new NotFoundError_1.NotFoundError(`Document with ID ${id} not found`);
        }
        // Generate signed URL
        const signedUrl = await this.signedUrlService.generate(doc.storageBucket, doc.storagePath, expiresInSeconds);
        // Audit download log
        await this.auditService.logAudit({
            action: 'DOCUMENT_DOWNLOADED',
            entityName: 'application_documents',
            entityId: id,
            afterState: { storagePath: doc.storagePath },
            userId: requestedBy,
            correlationId
        });
        return signedUrl;
    }
}
exports.DocumentDownloadService = DocumentDownloadService;
