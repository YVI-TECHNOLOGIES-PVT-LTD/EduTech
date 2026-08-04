"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratedQuestionRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class GeneratedQuestionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_generated_questions');
    }
    async saveQuestions(sectionId, questionIds) {
        const { error: delError } = await supabase_1.supabase
            .from(this.tableName)
            .delete()
            .eq('section_id', sectionId);
        if (delError)
            throw delError;
        if (!questionIds || questionIds.length === 0)
            return [];
        const payload = questionIds.map((qId, i) => ({
            section_id: sectionId,
            question_id: qId,
            sort_order: i + 1
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
exports.GeneratedQuestionRepository = GeneratedQuestionRepository;
exports.default = GeneratedQuestionRepository;
