"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcademicRecordRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class AcademicRecordRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('student_academic_records');
    }
    async saveAcademicRecord(schoolId, payload) {
        // Upsert matching student_id
        const { data: existing } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('student_id', payload.student_id)
            .maybeSingle();
        if (existing) {
            const { data, error } = await supabase_1.supabase
                .from(this.tableName)
                .update({
                cgpa: payload.cgpa,
                total_credits: payload.total_credits,
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
                school_id: schoolId,
                student_id: payload.student_id,
                cgpa: payload.cgpa,
                total_credits: payload.total_credits
            })
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
    }
    async logTimelineEvent(studentId, type, description) {
        const { data, error } = await supabase_1.supabase
            .from('student_academic_timeline')
            .insert({
            student_id: studentId,
            event_type: type,
            event_description: description
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.AcademicRecordRepository = AcademicRecordRepository;
exports.default = AcademicRecordRepository;
