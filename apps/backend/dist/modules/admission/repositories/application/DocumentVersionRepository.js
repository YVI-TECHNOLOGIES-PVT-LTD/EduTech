"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentVersionRepository = void 0;
const DocumentVersion_1 = require("../../domain/DocumentVersion");
const supabase_1 = require("../../../../config/supabase");
class DocumentVersionRepository {
    async save(version) {
        const { error } = await supabase_1.supabase
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
        if (error)
            throw error;
    }
    async findByDocumentId(docId) {
        const { data, error } = await supabase_1.supabase
            .from('document_versions')
            .select('*')
            .eq('document_id', docId)
            .order('version', { ascending: true });
        if (error)
            throw error;
        return (data || []).map(row => new DocumentVersion_1.DocumentVersion(row.id, row.document_id, row.version, row.storage_path, row.checksum, row.uploaded_by, new Date(row.uploaded_at)));
    }
}
exports.DocumentVersionRepository = DocumentVersionRepository;
