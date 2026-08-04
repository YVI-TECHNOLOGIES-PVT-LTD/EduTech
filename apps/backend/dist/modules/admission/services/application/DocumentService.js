"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentService = void 0;
const NotFoundError_1 = require("../../errors/NotFoundError");
class DocumentService {
    constructor(docRepo) {
        this.docRepo = docRepo;
    }
    async getDocumentById(id) {
        const doc = await this.docRepo.findById(id);
        if (!doc) {
            throw new NotFoundError_1.NotFoundError(`Document with ID ${id} not found`);
        }
        return doc;
    }
    async getDocumentsByApplicationId(applicationId) {
        return this.docRepo.findByApplicationId(applicationId);
    }
    async deleteDocument(id) {
        const doc = await this.docRepo.findById(id);
        if (!doc) {
            throw new NotFoundError_1.NotFoundError(`Document with ID ${id} not found`);
        }
        doc.softDelete();
        await this.docRepo.save(doc);
    }
}
exports.DocumentService = DocumentService;
