"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class RankingRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_rankings');
    }
    async saveStudentRank(sessionId, studentId, cgpa, rank) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            session_id: sessionId,
            student_id: studentId,
            cgpa,
            merit_rank: rank
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.RankingRepository = RankingRepository;
exports.default = RankingRepository;
