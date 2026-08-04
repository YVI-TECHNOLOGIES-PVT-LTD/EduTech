import { StudentPromotion } from '../domain/StudentPromotion';
import { supabase } from '../../../config/supabase';

export class PromotionRepository {
    public async savePromotion(promo: StudentPromotion): Promise<void> {
        const { error } = await supabase
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

        if (error) throw error;
    }

    public async findPromotionsByStudentId(studentId: string): Promise<StudentPromotion[]> {
        const { data, error } = await supabase
            .from('student_promotions')
            .select('*')
            .eq('student_id', studentId);

        if (error) throw error;
        return (data || []).map((row: any) => new StudentPromotion(
            row.id,
            row.student_id,
            row.from_academic_year_id,
            row.to_academic_year_id,
            row.from_grade,
            row.to_grade,
            row.from_section_id,
            row.to_section_id,
            row.promoted_by,
            new Date(row.promoted_at),
            row.promotion_reason
        ));
    }
}
