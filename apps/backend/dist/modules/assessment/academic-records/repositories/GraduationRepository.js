"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraduationRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class GraduationRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('graduation_candidates');
    }
    async saveCandidate(studentId, status) {
        const { data: existing } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();
        if (existing) {
            const { data, error } = await supabase_1.supabase
                .from(this.tableName)
                .update({
                status,
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
                status
            })
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
    }
    async getClearanceStatus(studentId) {
        const { data, error } = await supabase_1.supabase
            .from('graduation_clearance_items')
            .select('*')
            .eq('student_id', studentId);
        if (error)
            throw error;
        return data || [];
    }
    async approveClearance(studentId, type) {
        const { data, error } = await supabase_1.supabase
            .from('graduation_clearance_items')
            .insert({
            student_id: studentId,
            clearance_type: type,
            status: 'CLEARED'
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.GraduationRepository = GraduationRepository;
exports.default = GraduationRepository;
