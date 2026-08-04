"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplatePreviewCacheRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class TemplatePreviewCacheRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_template_preview_cache');
    }
    async findCache(templateId, format) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('template_id', templateId)
            .eq('format', format)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async saveCache(templateId, format, payload) {
        const { error: delError } = await supabase_1.supabase
            .from(this.tableName)
            .delete()
            .eq('template_id', templateId)
            .eq('format', format);
        if (delError)
            throw delError;
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 2); // 2 hours expiration
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            template_id: templateId,
            format,
            hash: payload.hash,
            html_path: payload.html_path || null,
            pdf_path: payload.pdf_path || null,
            thumbnail_path: payload.thumbnail_path || null,
            expires_at: expiresAt.toISOString()
        });
        if (error)
            throw error;
    }
    async invalidateCache(templateId) {
        const { error } = await supabase_1.supabase
            .from(this.tableName)
            .delete()
            .eq('template_id', templateId);
        if (error)
            throw error;
    }
}
exports.TemplatePreviewCacheRepository = TemplatePreviewCacheRepository;
exports.default = TemplatePreviewCacheRepository;
