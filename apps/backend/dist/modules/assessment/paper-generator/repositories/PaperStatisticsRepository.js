"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaperStatisticsRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class PaperStatisticsRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_generated_statistics');
    }
    async saveStatistics(paperId, stats) {
        const { error: delError } = await supabase_1.supabase
            .from(this.tableName)
            .delete()
            .eq('paper_id', paperId);
        if (delError)
            throw delError;
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            ...stats,
            paper_id: paperId
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.PaperStatisticsRepository = PaperStatisticsRepository;
exports.default = PaperStatisticsRepository;
