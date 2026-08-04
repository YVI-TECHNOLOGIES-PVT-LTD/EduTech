"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Document = void 0;
class Document {
    constructor(id, applicationId, documentTypeId, originalFilename, storedFilename, storageProvider, storageBucket, storagePath, mimeType, extension, fileSize, checksum, version, status, uploadedBy, verifiedBy, uploadedAt, verifiedAt, deletedAt, createdAt, updatedAt) {
        this.id = id;
        this.applicationId = applicationId;
        this.documentTypeId = documentTypeId;
        this.originalFilename = originalFilename;
        this.storedFilename = storedFilename;
        this.storageProvider = storageProvider;
        this.storageBucket = storageBucket;
        this.storagePath = storagePath;
        this.mimeType = mimeType;
        this.extension = extension;
        this.fileSize = fileSize;
        this.checksum = checksum;
        this.version = version;
        this.status = status;
        this.uploadedBy = uploadedBy;
        this.verifiedBy = verifiedBy;
        this.uploadedAt = uploadedAt;
        this.verifiedAt = verifiedAt;
        this.deletedAt = deletedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    updateStatus(newStatus, reviewerId = null) {
        this.status = newStatus;
        if (newStatus === 'VERIFIED') {
            this.verifiedBy = reviewerId;
            this.verifiedAt = new Date();
        }
        this.updatedAt = new Date();
    }
    incrementVersion(newPath, newChecksum, newSize) {
        this.version += 1;
        this.storagePath = newPath;
        this.checksum = newChecksum;
        this.fileSize = newSize;
        this.status = 'REUPLOADED';
        this.updatedAt = new Date();
    }
    softDelete() {
        this.deletedAt = new Date();
        this.updatedAt = new Date();
    }
}
exports.Document = Document;
