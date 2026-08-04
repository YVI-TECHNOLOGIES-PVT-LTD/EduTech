"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradeCardRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class GradeCardRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_grade_cards');
    }
    async createGradeCard(studentResultId, issueNumber, userId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            student_result_id: studentResultId,
            issue_number: issueNumber,
            issued_by: userId
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.GradeCardRepository = GradeCardRepository;
exports.default = GradeCardRepository;
