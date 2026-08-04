"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishedSectionRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class PublishedSectionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_published_sections');
    }
    async savePublishedSections(publishedPaperId, sections) {
        const payload = sections.map(sec => ({
            published_paper_id: publishedPaperId,
            section_name: sec.section_name,
            description: sec.description || null,
            points_per_question: sec.points_per_question,
            negative_marks: sec.negative_marks,
            total_questions: sec.total_questions,
            sort_order: sec.sort_order
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
exports.PublishedSectionRepository = PublishedSectionRepository;
exports.default = PublishedSectionRepository;
