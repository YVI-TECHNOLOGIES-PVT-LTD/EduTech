"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionStatisticsRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class QuestionStatisticsRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_question_statistics');
    }
    async saveQuestionStats(payload) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            question_snapshot_id: payload.question_snapshot_id,
            facility_value: payload.facility_value,
            difficulty_index: payload.difficulty_index,
            discrimination_index: payload.discrimination_index,
            skipped_pct: payload.skipped_pct,
            average_time_spent_seconds: payload.average_time_spent_seconds,
            median_marks: payload.median_marks,
            standard_deviation: payload.standard_deviation
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.QuestionStatisticsRepository = QuestionStatisticsRepository;
exports.default = QuestionStatisticsRepository;
