"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RubricRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class RubricRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_rubrics');
    }
    async listRubrics(schoolId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*, criteria:assessment_rubric_criteria(*)')
            .eq('school_id', schoolId);
        if (error)
            throw error;
        return data || [];
    }
    async findRubricById(rubricId, schoolId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*, criteria:assessment_rubric_criteria(*)')
            .eq('id', rubricId)
            .eq('school_id', schoolId)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async createRubric(schoolId, payload) {
        const { data: rubric, error: rErr } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            school_id: schoolId,
            question_snapshot_id: payload.question_snapshot_id,
            total_score: payload.total_score,
            template_id: payload.template_id || null
        })
            .select()
            .single();
        if (rErr)
            throw rErr;
        if (payload.criteria && payload.criteria.length > 0) {
            const criteriaPayload = payload.criteria.map((c) => ({
                rubric_id: rubric.id,
                name: c.name,
                weight: c.weight,
                description: c.description || null,
                criteria_levels: c.criteria_levels || []
            }));
            const { error: cErr } = await supabase_1.supabase
                .from('assessment_rubric_criteria')
                .insert(criteriaPayload);
            if (cErr)
                throw cErr;
        }
        return this.findRubricById(rubric.id, schoolId);
    }
}
exports.RubricRepository = RubricRepository;
exports.default = RubricRepository;
