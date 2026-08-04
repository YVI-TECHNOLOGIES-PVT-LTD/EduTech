"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateHeaderRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class TemplateHeaderRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_template_headers');
    }
    async findByTemplateId(templateId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('template_id', templateId)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async saveHeader(templateId, header) {
        const { error: delError } = await supabase_1.supabase
            .from(this.tableName)
            .delete()
            .eq('template_id', templateId);
        if (delError)
            throw delError;
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            ...header,
            template_id: templateId
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.TemplateHeaderRepository = TemplateHeaderRepository;
exports.default = TemplateHeaderRepository;
