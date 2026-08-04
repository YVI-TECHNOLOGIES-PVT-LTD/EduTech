import { BaseService } from '../BaseService';
import { DocumentRepository } from '../../repositories/application/DocumentRepository';
import { DocumentVersionRepository } from '../../repositories/application/DocumentVersionRepository';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { DocumentValidationService } from './DocumentValidationService';
import { IDocumentStorageProvider } from '../../storage/interfaces/IDocumentStorageProvider';
import { ChecksumService } from './ChecksumService';
import { Document } from '../../domain/Document';
import { DocumentVersion } from '../../domain/DocumentVersion';
import { AuditService } from '../AuditService';
import { supabase } from '../../../../config/supabase';
import {
    ApplicationWorkflowOrchestrator,
    type WorkflowEventContext,
} from './ApplicationWorkflowOrchestrator';

export class DocumentUploadService extends BaseService {
    private readonly BUCKET_NAME = 'admission-documents';

    constructor(
        private readonly docRepo: DocumentRepository,
        private readonly versionRepo: DocumentVersionRepository,
        private readonly appRepo: ApplicationRepository,
        private readonly valService: DocumentValidationService,
        private readonly storageProvider: IDocumentStorageProvider,
        private readonly checksumService: ChecksumService,
        private readonly auditService: AuditService,
        private readonly workflowOrchestrator?: ApplicationWorkflowOrchestrator
    ) {
        super();
    }

    /**
     * Uploads and registers a new document version safely.
     */
    public async uploadDocument(
        applicationId: string,
        docTypeCode: string,
        fileBuffer: Buffer,
        originalFilename: string,
        mimeType: string,
        uploadedBy: string | null,
        metadata?: { device?: string; browser?: string; ipAddress?: string; uploadedFrom?: string },
        correlationId?: string
    ): Promise<Document> {
        // Calculate file checksum SHA-256
        const checksum = this.checksumService.calculate(fileBuffer);
        const fileSize = fileBuffer.length;

        // Fetch application headers to resolve school/academic year contexts
        const application = await this.appRepo.findById(applicationId);
        if (!application) {
            throw new Error(`Application with ID ${applicationId} not found`);
        }

        // Run validation pipeline checks
        // Fetch matching document type code
        const docType = await this.valService.validateUpload(
            applicationId,
            docTypeCode,
            fileBuffer,
            originalFilename,
            mimeType,
            fileSize,
            checksum
        );

        // Build file naming strategy: schoolId/academicYear/applicationId/documentTypeCode/uuid.ext
        const extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
        const fileUuid = crypto.randomUUID();
        const storagePath = `${application.schoolId}/${application.academicYearId}/${applicationId}/${docTypeCode}/${fileUuid}${extension}`;

        // Upload file to cloud storage bucket
        await this.storageProvider.upload(this.BUCKET_NAME, storagePath, fileBuffer, mimeType);

        try {
            // Check if application already has this document type uploaded
            const existingDocs = await this.docRepo.findByApplicationId(applicationId);
            const duplicateTypeDoc = existingDocs.find(d => d.documentTypeId === docType.id);

            let doc: Document;

            if (duplicateTypeDoc) {
                // If yes, replace metadata, increment version, trigger state reupload
                doc = duplicateTypeDoc;
                const oldPath = doc.storagePath;
                doc.incrementVersion(storagePath, checksum, fileSize);
                
                await this.docRepo.save(doc);

                // Add to versions log history
                const versionLog = new DocumentVersion(
                    crypto.randomUUID(),
                    doc.id,
                    doc.version,
                    storagePath,
                    checksum,
                    uploadedBy,
                    new Date()
                );
                await this.versionRepo.save(versionLog);
            } else {
                // Initialize new Document
                const docId = crypto.randomUUID();
                doc = new Document(
                    docId,
                    applicationId,
                    docType.id,
                    originalFilename,
                    `${fileUuid}${extension}`,
                    'Supabase',
                    this.BUCKET_NAME,
                    storagePath,
                    mimeType,
                    extension,
                    fileSize,
                    checksum,
                    1,
                    'UPLOADED',
                    uploadedBy,
                    null,
                    new Date(),
                    null,
                    null,
                    new Date(),
                    new Date()
                );

                await this.docRepo.save(doc);

                // Add to versions log
                const versionLog = new DocumentVersion(
                    crypto.randomUUID(),
                    docId,
                    1,
                    storagePath,
                    checksum,
                    uploadedBy,
                    new Date()
                );
                await this.versionRepo.save(versionLog);
            }

            // Track timeline event under application workflow
            await this.appRepo.logWorkflow(
                applicationId,
                'DOCUMENT_UPLOADED',
                null,
                application.status,
                uploadedBy,
                `Document [${docType.name}] version ${doc.version} uploaded successfully.`
            );

            // Log status history transition log
            await supabase
                .from('status_history')
                .insert({
                    entity_name: 'application_documents',
                    entity_id: doc.id,
                    old_status: null,
                    new_status: doc.status,
                    reason: `Uploaded version ${doc.version}`,
                    changed_by: uploadedBy,
                    correlation_id: correlationId,
                    event_name: 'DocumentUploaded',
                    metadata: metadata ? JSON.stringify(metadata) : null
                });

            // Log audit trail
            await this.auditService.logAudit({
                action: 'DOCUMENT_UPLOADED',
                entityName: 'application_documents',
                entityId: doc.id,
                afterState: { storagePath, checksum, version: doc.version },
                userId: uploadedBy,
                correlationId
            });

            if (this.workflowOrchestrator) {
                const ctx: WorkflowEventContext = {
                    userId: uploadedBy,
                    role: metadata?.uploadedFrom ?? 'ADMISSION_OFFICER',
                    correlationId,
                    notes: `Document uploaded: ${docType.name}`,
                    ipAddress: metadata?.ipAddress,
                    browser: metadata?.browser,
                    schoolId: application.schoolId,
                    academicYearId: application.academicYearId,
                };
                await this.workflowOrchestrator.publish('DOCUMENT_UPLOADED', applicationId, ctx);
            }

            return doc;
        } catch (dbErr) {
            // Storage rollback: remove uploaded file from cloud storage if DB insert fails
            await this.storageProvider.delete(this.BUCKET_NAME, storagePath);
            throw dbErr;
        }
    }

    public async bulkUpload(
        applicationId: string,
        uploads: Array<{
            docTypeCode: string;
            fileBuffer: Buffer;
            originalFilename: string;
            mimeType: string;
        }>,
        uploadedBy: string | null,
        metadata?: { device?: string; browser?: string; ipAddress?: string; uploadedFrom?: string },
        correlationId?: string
    ): Promise<Document[]> {
        const results: Document[] = [];
        for (const item of uploads) {
            const doc = await this.uploadDocument(
                applicationId,
                item.docTypeCode,
                item.fileBuffer,
                item.originalFilename,
                item.mimeType,
                uploadedBy,
                metadata,
                correlationId
            );
            results.push(doc);
        }
        return results;
    }
}
