"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentVersion = void 0;
class DocumentVersion {
    constructor(id, documentId, version, storagePath, checksum, uploadedBy, uploadedAt) {
        this.id = id;
        this.documentId = documentId;
        this.version = version;
        this.storagePath = storagePath;
        this.checksum = checksum;
        this.uploadedBy = uploadedBy;
        this.uploadedAt = uploadedAt;
    }
}
exports.DocumentVersion = DocumentVersion;
