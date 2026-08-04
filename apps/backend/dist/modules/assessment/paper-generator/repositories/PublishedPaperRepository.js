"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishedPaperRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class PublishedPaperRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_published_papers');
    }
    async findByGeneratedId(generatedId, schoolId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('generated_paper_id', generatedId)
            .eq('school_id', schoolId)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async publishPaper(schoolId, payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            ...payload,
            school_id: schoolId
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.PublishedPaperRepository = PublishedPaperRepository;
exports.default = PublishedPaperRepository;
