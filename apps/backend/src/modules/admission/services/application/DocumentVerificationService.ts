import { BaseService } from '../BaseService';
import { DocumentRepository } from '../../repositories/application/DocumentRepository';
import { DocumentTypeRepository } from '../../repositories/application/DocumentTypeRepository';
import { ApplicationRepository } from '../../repositories/application/ApplicationRepository';
import { DocumentStateMachine } from './state-machine/DocumentStateMachine';
import { Document } from '../../domain/Document';
import { NotFoundError } from '../../errors/NotFoundError';
import { AuditService } from '../AuditService';
import { supabase } from '../../../../config/supabase';
import {
    ApplicationWorkflowOrchestrator,
    type WorkflowEventContext,
} from './ApplicationWorkflowOrchestrator';

export class DocumentVerificationService extends BaseService {
    constructor(
        private readonly docRepo: DocumentRepository,
        private readonly typeRepo: DocumentTypeRepository,
        private readonly appRepo: ApplicationRepository,
        private readonly stateMachine: DocumentStateMachine,
        private readonly auditService: AuditService,
        private readonly workflowOrchestrator?: ApplicationWorkflowOrchestrator
    ) {
        super();
    }

    /**
     * Common verification workflow transitions coordinator.
     */
    private async executeTransition(
        id: string,
        newStatus: any,
        reviewerId: string | null,
        role: string,
        remarks: string | null,
        correlationId?: string
    ): Promise<Document> {
        const doc = await this.docRepo.findById(id);
        if (!doc) {
            throw new NotFoundError(`Document with ID ${id} not found`);
        }

        const oldStatus = doc.status;
        if (oldStatus === newStatus) {
            return doc;
        }

        // Validate transitions constraint rule
        await this.stateMachine.validateTransition(oldStatus, newStatus, role);

        // Update Document status
        doc.updateStatus(newStatus, reviewerId);
        await this.docRepo.save(doc);

        // Save Review remarks comment
        if (remarks) {
            await this.docRepo.logComment(id, remarks, 'REVIEWER', reviewerId);
        }

        // Log Verification activity log
        await this.docRepo.logVerification(id, newStatus, reviewerId, remarks);

        // Track timeline update in application workflow log
        const docType = await this.typeRepo.findById(doc.documentTypeId);
        const docTypeName = docType ? docType.name : 'Document';
        await this.appRepo.logWorkflow(
            doc.applicationId,
            `DOCUMENT_${newStatus}`,
            null,
            newStatus,
            reviewerId,
            `Document [${docTypeName}] verification state transitioned: ${oldStatus} -> ${newStatus}. Remarks: ${remarks || 'None'}`
        );

        // Log status change history record
        await supabase
            .from('status_history')
            .insert({
                entity_name: 'application_documents',
                entity_id: id,
                old_status: oldStatus,
                new_status: newStatus,
                reason: remarks || `Verification status updated to ${newStatus}`,
                changed_by: reviewerId,
                correlation_id: correlationId,
                event_name: `DocumentStatusChanged`
            });

        // Audit Trail log
        await this.auditService.logAudit({
            action: `DOCUMENT_VERIFICATION_${newStatus}`,
            entityName: 'application_documents',
            entityId: id,
            beforeState: { status: oldStatus },
            afterState: { status: newStatus, remarks },
            userId: reviewerId,
            correlationId
        });

        return doc;
    }

    private async publishWorkflowAfterDocumentChange(
        doc: Document,
        event: 'DOCUMENT_VERIFIED' | 'DOCUMENT_REJECTED',
        reviewerId: string | null,
        role: string,
        remarks: string | null,
        correlationId?: string
    ): Promise<void> {
        if (!this.workflowOrchestrator) {
            return;
        }

        const application = await this.appRepo.findById(doc.applicationId);
        if (!application) {
            return;
        }

        const ctx: WorkflowEventContext = {
            userId: reviewerId,
            role,
            correlationId,
            notes: remarks ?? undefined,
            schoolId: application.schoolId,
            academicYearId: application.academicYearId,
        };

        if (event === 'DOCUMENT_VERIFIED') {
            await this.workflowOrchestrator.publish('DOCUMENT_VERIFIED', doc.applicationId, ctx);
        } else {
            await this.workflowOrchestrator.publish('DOCUMENT_REJECTED', doc.applicationId, ctx);
        }
    }

    public async verify(
        id: string,
        reviewerId: string | null,
        remarks: string | null,
        role: string,
        correlationId?: string
    ): Promise<Document> {
        const existing = await this.docRepo.findById(id);
        if (existing && (existing.status === 'UPLOADED' || existing.status === 'REUPLOADED')) {
            await this.executeTransition(id, 'PENDING_VERIFICATION', reviewerId, role, remarks, correlationId);
        }
        const doc = await this.executeTransition(id, 'VERIFIED', reviewerId, role, remarks, correlationId);
        await this.publishWorkflowAfterDocumentChange(doc, 'DOCUMENT_VERIFIED', reviewerId, role, remarks, correlationId);
        return doc;
    }

    public async reject(
        id: string,
        reviewerId: string | null,
        remarks: string,
        role: string,
        correlationId?: string
    ): Promise<Document> {
        const doc = await this.executeTransition(id, 'REJECTED', reviewerId, role, remarks, correlationId);
        await this.publishWorkflowAfterDocumentChange(doc, 'DOCUMENT_REJECTED', reviewerId, role, remarks, correlationId);
        return doc;
    }

    public async requestCorrection(
        id: string,
        reviewerId: string | null,
        remarks: string,
        role: string,
        correlationId?: string
    ): Promise<Document> {
        return this.executeTransition(id, 'CORRECTION_REQUIRED', reviewerId, role, remarks, correlationId);
    }

    public async bulkVerify(
        documentIds: string[],
        reviewerId: string | null,
        role: string,
        remarks: string | null,
        correlationId?: string
    ): Promise<Document[]> {
        const results: Document[] = [];
        for (const id of documentIds) {
            const doc = await this.verify(id, reviewerId, remarks, role, correlationId);
            results.push(doc);
        }
        return results;
    }
}
