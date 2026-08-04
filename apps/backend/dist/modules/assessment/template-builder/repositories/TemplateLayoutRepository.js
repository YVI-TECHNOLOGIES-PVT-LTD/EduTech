"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateLayoutRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class TemplateLayoutRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_template_layout_rules');
    }
    async findByTemplateId(templateId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('template_id', templateId);
        if (error)
            throw error;
        return data || [];
    }
    async saveLayoutRules(templateId, rules) {
        const { error: delError } = await supabase_1.supabase
            .from(this.tableName)
            .delete()
            .eq('template_id', templateId);
        if (delError)
            throw delError;
        if (!rules || rules.length === 0)
            return [];
        const payload = rules.map(r => ({
            template_id: templateId,
            property: r.property,
            value: String(r.value)
        }));
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert(payload)
            .select();
        if (error)
            throw error;
        return data || [];
    }
}
exports.TemplateLayoutRepository = TemplateLayoutRepository;
exports.default = TemplateLayoutRepository;
