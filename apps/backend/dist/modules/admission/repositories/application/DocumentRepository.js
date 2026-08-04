"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentRepository = void 0;
const BaseRepository_1 = require("../BaseRepository");
const Document_1 = require("../../domain/Document");
const supabase_1 = require("../../../../config/supabase");
class DocumentRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('application_documents');
    }
    toDomain(row) {
        return new Document_1.Document(row.id, row.application_id, row.document_type_id, row.original_filename, row.stored_filename, row.storage_provider, row.storage_bucket, row.storage_path, row.mime_type, row.extension, row.file_size, row.checksum, row.version, row.status, row.uploaded_by, row.verified_by, row.uploaded_at ? new Date(row.uploaded_at) : new Date(), row.verified_at ? new Date(row.verified_at) : null, row.deleted_at ? new Date(row.deleted_at) : null, new Date(row.created_at), new Date(row.updated_at));
    }
    async findById(id) {
        const { data, error } = await supabase_1.supabase
            .from('application_documents')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .maybeSingle();
        if (error)
            throw error;
        return data ? this.toDomain(data) : null;
    }
    async findByApplicationId(applicationId) {
        const { data, error } = await supabase_1.supabase
            .from('application_documents')
            .select('*')
            .eq('application_id', applicationId)
            .is('deleted_at', null);
        if (error)
            throw error;
        return (data || []).map(row => this.toDomain(row));
    }
    async findByChecksum(checksum) {
        const { data, error } = await supabase_1.supabase
            .from('application_documents')
            .select('*')
            .eq('checksum', checksum)
            .is('deleted_at', null)
            .maybeSingle();
        if (error)
            throw error;
        return data ? this.toDomain(data) : null;
    }
    async save(doc) {
        const payload = {
            id: doc.id,
            application_id: doc.applicationId,
            document_type_id: doc.documentTypeId,
            original_filename: doc.originalFilename,
            stored_filename: doc.storedFilename,
            storage_provider: doc.storageProvider,
            storage_bucket: doc.storageBucket,
            storage_path: doc.storagePath,
            mime_type: doc.mimeType,
            extension: doc.extension,
            file_size: doc.fileSize,
            checksum: doc.checksum,
            version: doc.version,
            status: doc.status,
            uploaded_by: doc.uploadedBy,
            verified_by: doc.verifiedBy,
            uploaded_at: doc.uploadedAt.toISOString(),
            verified_at: doc.verifiedAt?.toISOString() || null,
            deleted_at: doc.deletedAt?.toISOString() || null,
            updated_at: doc.updatedAt.toISOString()
        };
        const { error } = await supabase_1.supabase
            .from('application_documents')
            .upsert(payload);
        if (error)
            throw error;
    }
    async logComment(docId, comment, commentType, createdBy) {
        const { error } = await supabase_1.supabase
            .from('document_comments')
            .insert({
            document_id: docId,
            comment,
            comment_type: commentType,
            created_by: createdBy
        });
        if (error)
            throw error;
    }
    async logVerification(docId, status, reviewerId, remarks) {
        const { error } = await supabase_1.supabase
            .from('document_verification')
            .insert({
            document_id: docId,
            status,
            reviewer_id: reviewerId,
            remarks: remarks || null
        });
        if (error)
            throw error;
    }
    async findComments(docId) {
        const { data, error } = await supabase_1.supabase
            .from('document_comments')
            .select('*')
            .eq('document_id', docId)
            .order('created_at', { ascending: true });
        if (error)
            throw error;
        return data || [];
    }
    async getWorkflowRule(fromStatus, toStatus, role) {
        const { data, error } = await supabase_1.supabase
            .from('document_workflow_rules')
            .select('allowed')
            .eq('from_status', fromStatus)
            .eq('to_status', toStatus)
            .eq('role', role)
            .maybeSingle();
        if (error)
            throw error;
        return data ? data.allowed : false;
    }
}
exports.DocumentRepository = DocumentRepository;
