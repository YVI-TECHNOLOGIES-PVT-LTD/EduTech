"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionOptionRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class QuestionOptionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_question_options');
    }
    async findByQuestionId(questionId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('question_id', questionId)
            .eq('is_deleted', false);
        if (error)
            throw error;
        return data || [];
    }
    async saveOptions(questionId, options) {
        // Soft delete old options
        const { error: deleteError } = await supabase_1.supabase
            .from(this.tableName)
            .update({ is_deleted: true })
            .eq('question_id', questionId);
        if (deleteError)
            throw deleteError;
        if (!options || options.length === 0)
            return [];
        const payload = options.map(opt => ({
            question_id: questionId,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            is_deleted: false
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
exports.QuestionOptionRepository = QuestionOptionRepository;
exports.default = QuestionOptionRepository;
