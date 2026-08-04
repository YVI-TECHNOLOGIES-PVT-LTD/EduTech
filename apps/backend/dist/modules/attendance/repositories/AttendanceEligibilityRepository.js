"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceEligibilityRepository = void 0;
const supabase_1 = require("../../../config/supabase");
const BaseRepository_1 = require("../../admission/repositories/BaseRepository");
class AttendanceEligibilityRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('attendance_eligibility');
    }
    async saveEligibility(studentId, subjectId, percentage, isEligible) {
        const { data: existing } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('student_id', studentId)
            .eq('subject_id', subjectId)
            .maybeSingle();
        if (existing) {
            const { data, error } = await supabase_1.supabase
                .from(this.tableName)
                .update({
                attendance_percentage: percentage,
                is_eligible: isEligible,
                updated_at: new Date()
            })
                .eq('id', existing.id)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        else {
            const { data, error } = await supabase_1.supabase
                .from(this.tableName)
                .insert({
                student_id: studentId,
                subject_id: subjectId,
                attendance_percentage: percentage,
                is_eligible: isEligible
            })
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
    }
}
exports.AttendanceEligibilityRepository = AttendanceEligibilityRepository;
exports.default = AttendanceEligibilityRepository;
