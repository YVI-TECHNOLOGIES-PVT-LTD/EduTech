"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class PromotionRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_promotion_decisions');
    }
    async savePromotionDecision(studentId, academicYearId, decision, remarks, userId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            student_id: studentId,
            academic_year_id: academicYearId,
            decision,
            remarks: remarks || null,
            decided_by: userId
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.PromotionRepository = PromotionRepository;
exports.default = PromotionRepository;
