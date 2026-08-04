"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratedSectionRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class GeneratedSectionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_generated_sections');
    }
    async saveSections(paperId, sections) {
        const { error: delError } = await supabase_1.supabase
            .from(this.tableName)
            .delete()
            .eq('paper_id', paperId);
        if (delError)
            throw delError;
        if (!sections || sections.length === 0)
            return [];
        const payload = sections.map((sec, i) => ({
            paper_id: paperId,
            section_name: sec.section_name,
            description: sec.description || null,
            points_per_question: sec.points_per_question || 1.00,
            negative_marks: sec.negative_marks || 0.00,
            total_questions: sec.total_questions,
            sort_order: sec.sort_order || (i + 1)
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
exports.GeneratedSectionRepository = GeneratedSectionRepository;
exports.default = GeneratedSectionRepository;
