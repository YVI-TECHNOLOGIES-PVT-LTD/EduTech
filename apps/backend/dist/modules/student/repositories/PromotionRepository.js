"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionRepository = void 0;
const StudentPromotion_1 = require("../domain/StudentPromotion");
const supabase_1 = require("../../../config/supabase");
class PromotionRepository {
    async savePromotion(promo) {
        const { error } = await supabase_1.supabase
            .from('student_promotions')
            .upsert({
            id: promo.id,
            student_id: promo.studentId,
            from_academic_year_id: promo.fromAcademicYearId,
            to_academic_year_id: promo.toAcademicYearId,
            from_grade: promo.fromGrade,
            to_grade: promo.toGrade,
            from_section_id: promo.fromSectionId,
            to_section_id: promo.toSectionId,
            promoted_by: promo.promotedBy,
            promoted_at: promo.promotedAt.toISOString(),
            promotion_reason: promo.promotionReason
        });
        if (error)
            throw error;
    }
    async findPromotionsByStudentId(studentId) {
        const { data, error } = await supabase_1.supabase
            .from('student_promotions')
            .select('*')
            .eq('student_id', studentId);
        if (error)
            throw error;
        return (data || []).map((row) => new StudentPromotion_1.StudentPromotion(row.id, row.student_id, row.from_academic_year_id, row.to_academic_year_id, row.from_grade, row.to_grade, row.from_section_id, row.to_section_id, row.promoted_by, new Date(row.promoted_at), row.promotion_reason));
    }
}
exports.PromotionRepository = PromotionRepository;
