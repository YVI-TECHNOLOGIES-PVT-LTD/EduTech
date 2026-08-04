"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class StatisticsRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_result_statistics');
    }
    async saveStatistics(sessionId, payload) {
        const { error: delError } = await supabase_1.supabase
            .from(this.tableName)
            .delete()
            .eq('session_id', sessionId);
        if (delError)
            throw delError;
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            session_id: sessionId,
            pass_pct: payload.pass_pct,
            fail_pct: payload.fail_pct,
            average_gpa: payload.average_gpa,
            median_gpa: payload.median_gpa,
            standard_deviation: payload.standard_deviation,
            distinction_count: payload.distinction_count,
            first_class_count: payload.first_class_count
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.StatisticsRepository = StatisticsRepository;
exports.default = StatisticsRepository;
