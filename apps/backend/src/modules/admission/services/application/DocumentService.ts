import { DocumentRepository } from '../../repositories/application/DocumentRepository';
import { Document } from '../../domain/Document';
import { NotFoundError } from '../../errors/NotFoundError';

export class DocumentService {
    constructor(private readonly docRepo: DocumentRepository) {}

    public async getDocumentById(id: string): Promise<Document> {
        const doc = await this.docRepo.findById(id);
        if (!doc) {
            throw new NotFoundError(`Document with ID ${id} not found`);
        }
        return doc;
    }

    public async getDocumentsByApplicationId(applicationId: string): Promise<Document[]> {
        return this.docRepo.findByApplicationId(applicationId);
    }

    public async deleteDocument(id: string): Promise<void> {
        const doc = await this.docRepo.findById(id);
        if (!doc) {
            throw new NotFoundError(`Document with ID ${id} not found`);
        }
        doc.softDelete();
        await this.docRepo.save(doc);
    }
}
