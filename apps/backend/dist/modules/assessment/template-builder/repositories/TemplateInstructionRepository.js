"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateInstructionRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class TemplateInstructionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_template_instructions');
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
    async saveInstructions(templateId, instructionsText) {
        const { error: delError } = await supabase_1.supabase
            .from(this.tableName)
            .delete()
            .eq('template_id', templateId);
        if (delError)
            throw delError;
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            template_id: templateId,
            instructions_text: instructionsText
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.TemplateInstructionRepository = TemplateInstructionRepository;
exports.default = TemplateInstructionRepository;
