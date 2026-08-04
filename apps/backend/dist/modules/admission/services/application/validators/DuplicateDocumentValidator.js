"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateDocumentValidator = void 0;
const ConflictError_1 = require("../../../errors/ConflictError");
class DuplicateDocumentValidator {
    constructor(docRepo) {
        this.docRepo = docRepo;
    }
    async validate(checksum, excludeDocId) {
        const existing = await this.docRepo.findByChecksum(checksum);
        if (existing && existing.id !== excludeDocId) {
            throw new ConflictError_1.ConflictError(`Duplicate file upload detected. This exact file checksum was already uploaded under Document ID: ${existing.id}`);
        }
    }
}
exports.DuplicateDocumentValidator = DuplicateDocumentValidator;
