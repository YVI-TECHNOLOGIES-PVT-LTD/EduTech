"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentVersionService = void 0;
const DocumentVersion_1 = require("../../domain/DocumentVersion");
const NotFoundError_1 = require("../../errors/NotFoundError");
class DocumentVersionService {
    constructor(versionRepo, docRepo) {
        this.versionRepo = versionRepo;
        this.docRepo = docRepo;
    }
    async getVersions(documentId) {
        return this.versionRepo.findByDocumentId(documentId);
    }
    async restoreVersion(documentId, targetVersion, restoredBy) {
        const doc = await this.docRepo.findById(documentId);
        if (!doc) {
            throw new NotFoundError_1.NotFoundError(`Document with ID ${documentId} not found`);
        }
        const versions = await this.versionRepo.findByDocumentId(documentId);
        const match = versions.find(v => v.version === targetVersion);
        if (!match) {
            throw new NotFoundError_1.NotFoundError(`Version ${targetVersion} not found for document ${documentId}`);
        }
        doc.storagePath = match.storagePath;
        doc.checksum = match.checksum;
        doc.version = targetVersion;
        doc.status = 'REUPLOADED';
        await this.docRepo.save(doc);
        const restoreLog = new DocumentVersion_1.DocumentVersion(crypto.randomUUID(), documentId, doc.version, match.storagePath, match.checksum, restoredBy, new Date());
        await this.versionRepo.save(restoreLog);
        return restoreLog;
    }
}
exports.DocumentVersionService = DocumentVersionService;
