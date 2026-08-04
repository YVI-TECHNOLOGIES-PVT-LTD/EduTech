import { BaseService } from '../BaseService';
import { DocumentRepository } from '../../repositories/application/DocumentRepository';
import { SignedUrlService } from './SignedUrlService';
import { NotFoundError } from '../../errors/NotFoundError';
import { AuditService } from '../AuditService';

export class DocumentDownloadService extends BaseService {
    constructor(
        private readonly docRepo: DocumentRepository,
        private readonly signedUrlService: SignedUrlService,
        private readonly auditService: AuditService
    ) {
        super();
    }

    /**
     * Generates a signed read URL for an application document.
     */
    public async getSignedDownloadUrl(
        id: string,
        requestedBy: string | null,
        expiresInSeconds: number = 3600,
        correlationId?: string
    ): Promise<string> {
        const doc = await this.docRepo.findById(id);
        if (!doc) {
            throw new NotFoundError(`Document with ID ${id} not found`);
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
