import { DocumentVersion } from '../../domain/DocumentVersion';
import { supabase } from '../../../../config/supabase';

export class DocumentVersionRepository {
    public async save(version: DocumentVersion): Promise<void> {
        const { error } = await supabase
            .from('document_versions')
            .insert({
                id: version.id,
                document_id: version.documentId,
                version: version.version,
                storage_path: version.storagePath,
                checksum: version.checksum,
                uploaded_by: version.uploadedBy,
                uploaded_at: version.uploadedAt.toISOString()
            });

        if (error) throw error;
    }

    public async findByDocumentId(docId: string): Promise<DocumentVersion[]> {
        const { data, error } = await supabase
            .from('document_versions')
            .select('*')
            .eq('document_id', docId)
            .order('version', { ascending: true });

        if (error) throw error;
        return (data || []).map(row => new DocumentVersion(
            row.id,
            row.document_id,
            row.version,
            row.storage_path,
            row.checksum,
            row.uploaded_by,
            new Date(row.uploaded_at)
        ));
    }
}
