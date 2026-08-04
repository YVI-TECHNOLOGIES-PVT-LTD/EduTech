import { DocumentRepository } from '../../../repositories/application/DocumentRepository';
import { ConflictError } from '../../../errors/ConflictError';

export class DuplicateDocumentValidator {
    constructor(private readonly docRepo: DocumentRepository) {}

    public async validate(checksum: string, excludeDocId?: string): Promise<void> {
        const existing = await this.docRepo.findByChecksum(checksum);
        if (existing && existing.id !== excludeDocId) {
            throw new ConflictError(
                `Duplicate file upload detected. This exact file checksum was already uploaded under Document ID: ${existing.id}`
            );
        }
    }
}
