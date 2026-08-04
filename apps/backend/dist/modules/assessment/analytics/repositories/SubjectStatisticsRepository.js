"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectStatisticsRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class SubjectStatisticsRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_subject_statistics');
    }
    async saveSubjectStats(payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            subject_id: payload.subject_id,
            academic_year_id: payload.academic_year_id,
            pass_pct: payload.pass_pct,
            average_gpa: payload.average_gpa,
            enrolled_count: payload.enrolled_count,
            highest_score: payload.highest_score,
            lowest_score: payload.lowest_score
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.SubjectStatisticsRepository = SubjectStatisticsRepository;
exports.default = SubjectStatisticsRepository;
