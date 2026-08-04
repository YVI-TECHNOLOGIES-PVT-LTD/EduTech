"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicStandingRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class AcademicStandingRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('student_academic_standing');
    }
    async saveStanding(studentId, standing) {
        const { data: existing } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();
        if (existing) {
            const { data, error } = await supabase_1.supabase
                .from(this.tableName)
                .update({
                current_standing: standing,
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
                current_standing: standing
            })
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
    }
    async logWarning(studentId, reason) {
        const { data, error } = await supabase_1.supabase
            .from('student_warning_history')
            .insert({ student_id: studentId, reason })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.AcademicStandingRepository = AcademicStandingRepository;
exports.default = AcademicStandingRepository;
