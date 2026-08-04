import { BaseRepository } from '../BaseRepository';
import { Document, DocumentStatus } from '../../domain/Document';
import { supabase } from '../../../../config/supabase';

export class DocumentRepository extends BaseRepository<Document> {
    constructor() {
        super('application_documents');
    }

    protected toDomain(row: any): Document {
        return new Document(
            row.id,
            row.application_id,
            row.document_type_id,
            row.original_filename,
            row.stored_filename,
            row.storage_provider,
            row.storage_bucket,
            row.storage_path,
            row.mime_type,
            row.extension,
            row.file_size,
            row.checksum,
            row.version,
            row.status as DocumentStatus,
            row.uploaded_by,
            row.verified_by,
            row.uploaded_at ? new Date(row.uploaded_at) : new Date(),
            row.verified_at ? new Date(row.verified_at) : null,
            row.deleted_at ? new Date(row.deleted_at) : null,
            new Date(row.created_at),
            new Date(row.updated_at)
        );
    }

    public async findById(id: string): Promise<Document | null> {
        const { data, error } = await supabase
            .from('application_documents')
            .select('*')
            .eq('id', id)
            .is('deleted_at', null)
            .maybeSingle();

        if (error) throw error;
        return data ? this.toDomain(data) : null;
    }

    public async findByApplicationId(applicationId: string): Promise<Document[]> {
        const { data, error } = await supabase
            .from('application_documents')
            .select('*')
            .eq('application_id', applicationId)
            .is('deleted_at', null);

        if (error) throw error;
        return (data || []).map(row => this.toDomain(row));
    }

    public async findByChecksum(checksum: string): Promise<Document | null> {
        const { data, error } = await supabase
            .from('application_documents')
            .select('*')
            .eq('checksum', checksum)
            .is('deleted_at', null)
            .maybeSingle();

        if (error) throw error;
        return data ? this.toDomain(data) : null;
    }

    public async save(doc: Document): Promise<void> {
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

        const { error } = await supabase
            .from('application_documents')
            .upsert(payload);

        if (error) throw error;
    }

    public async logComment(
        docId: string,
        comment: string,
        commentType: string,
        createdBy: string | null
    ): Promise<void> {
        const { error } = await supabase
            .from('document_comments')
            .insert({
                document_id: docId,
                comment,
                comment_type: commentType,
                created_by: createdBy
            });

        if (error) throw error;
    }

    public async logVerification(
        docId: string,
        status: string,
        reviewerId: string | null,
        remarks?: string | null
    ): Promise<void> {
        const { error } = await supabase
            .from('document_verification')
            .insert({
                document_id: docId,
                status,
                reviewer_id: reviewerId,
                remarks: remarks || null
            });

        if (error) throw error;
    }

    public async findComments(docId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from('document_comments')
            .select('*')
            .eq('document_id', docId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    public async getWorkflowRule(fromStatus: string, toStatus: string, role: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('document_workflow_rules')
            .select('allowed')
            .eq('from_status', fromStatus)
            .eq('to_status', toStatus)
            .eq('role', role)
            .maybeSingle();

        if (error) throw error;
        return data ? data.allowed : false;
    }
}
