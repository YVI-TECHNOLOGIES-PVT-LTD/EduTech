"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentVerificationService = void 0;
const BaseService_1 = require("../BaseService");
const NotFoundError_1 = require("../../errors/NotFoundError");
const supabase_1 = require("../../../../config/supabase");
class DocumentVerificationService extends BaseService_1.BaseService {
    constructor(docRepo, typeRepo, appRepo, stateMachine, auditService, workflowOrchestrator) {
        super();
        this.docRepo = docRepo;
        this.typeRepo = typeRepo;
        this.appRepo = appRepo;
        this.stateMachine = stateMachine;
        this.auditService = auditService;
        this.workflowOrchestrator = workflowOrchestrator;
    }
    /**
     * Common verification workflow transitions coordinator.
     */
    async executeTransition(id, newStatus, reviewerId, role, remarks, correlationId) {
        const doc = await this.docRepo.findById(id);
        if (!doc) {
            throw new NotFoundError_1.NotFoundError(`Document with ID ${id} not found`);
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
        await this.appRepo.logWorkflow(doc.applicationId, `DOCUMENT_${newStatus}`, null, newStatus, reviewerId, `Document [${docTypeName}] verification state transitioned: ${oldStatus} -> ${newStatus}. Remarks: ${remarks || 'None'}`);
        // Log status change history record
        await supabase_1.supabase
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
    async publishWorkflowAfterDocumentChange(doc, event, reviewerId, role, remarks, correlationId) {
        if (!this.workflowOrchestrator) {
            return;
        }
        const application = await this.appRepo.findById(doc.applicationId);
        if (!application) {
            return;
        }
        const ctx = {
            userId: reviewerId,
            role,
            correlationId,
            notes: remarks ?? undefined,
            schoolId: application.schoolId,
            academicYearId: application.academicYearId,
        };
        if (event === 'DOCUMENT_VERIFIED') {
            await this.workflowOrchestrator.publish('DOCUMENT_VERIFIED', doc.applicationId, ctx);
        }
        else {
            await this.workflowOrchestrator.publish('DOCUMENT_REJECTED', doc.applicationId, ctx);
        }
    }
    async verify(id, reviewerId, remarks, role, correlationId) {
        const existing = await this.docRepo.findById(id);
        if (existing && (existing.status === 'UPLOADED' || existing.status === 'REUPLOADED')) {
            await this.executeTransition(id, 'PENDING_VERIFICATION', reviewerId, role, remarks, correlationId);
        }
        const doc = await this.executeTransition(id, 'VERIFIED', reviewerId, role, remarks, correlationId);
        await this.publishWorkflowAfterDocumentChange(doc, 'DOCUMENT_VERIFIED', reviewerId, role, remarks, correlationId);
        return doc;
    }
    async reject(id, reviewerId, remarks, role, correlationId) {
        const doc = await this.executeTransition(id, 'REJECTED', reviewerId, role, remarks, correlationId);
        await this.publishWorkflowAfterDocumentChange(doc, 'DOCUMENT_REJECTED', reviewerId, role, remarks, correlationId);
        return doc;
    }
    async requestCorrection(id, reviewerId, remarks, role, correlationId) {
        return this.executeTransition(id, 'CORRECTION_REQUIRED', reviewerId, role, remarks, correlationId);
    }
    async bulkVerify(documentIds, reviewerId, role, remarks, correlationId) {
        const results = [];
        for (const id of documentIds) {
            const doc = await this.verify(id, reviewerId, remarks, role, correlationId);
            results.push(doc);
        }
        return results;
    }
}
exports.DocumentVerificationService = DocumentVerificationService;
