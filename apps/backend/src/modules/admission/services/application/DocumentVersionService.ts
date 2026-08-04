import { DocumentVersionRepository } from '../../repositories/application/DocumentVersionRepository';
import { DocumentRepository } from '../../repositories/application/DocumentRepository';
import { DocumentVersion } from '../../domain/DocumentVersion';
import { NotFoundError } from '../../errors/NotFoundError';

export class DocumentVersionService {
    constructor(
        private readonly versionRepo: DocumentVersionRepository,
        private readonly docRepo: DocumentRepository
    ) {}

    public async getVersions(documentId: string): Promise<DocumentVersion[]> {
        return this.versionRepo.findByDocumentId(documentId);
    }

    public async restoreVersion(
        documentId: string,
        targetVersion: number,
        restoredBy: string | null
    ): Promise<DocumentVersion> {
        const doc = await this.docRepo.findById(documentId);
        if (!doc) {
            throw new NotFoundError(`Document with ID ${documentId} not found`);
        }

        const versions = await this.versionRepo.findByDocumentId(documentId);
        const match = versions.find(v => v.version === targetVersion);
        if (!match) {
            throw new NotFoundError(`Version ${targetVersion} not found for document ${documentId}`);
        }

        doc.storagePath = match.storagePath;
        doc.checksum = match.checksum;
        doc.version = targetVersion;
        doc.status = 'REUPLOADED';
        await this.docRepo.save(doc);

        const restoreLog = new DocumentVersion(
            crypto.randomUUID(),
            documentId,
            doc.version,
            match.storagePath,
            match.checksum,
            restoredBy,
            new Date()
        );
        await this.versionRepo.save(restoreLog);
        return restoreLog;
    }
}
