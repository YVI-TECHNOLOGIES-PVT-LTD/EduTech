"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class ResultRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_result_sessions');
    }
    async listSessions(schoolId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('school_id', schoolId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data || [];
    }
    async findSessionById(sessionId, schoolId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', sessionId)
            .eq('school_id', schoolId)
            .maybeSingle();
        if (error)
            throw error;
        return data;
    }
    async createSession(schoolId, payload, userId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            school_id: schoolId,
            academic_year_id: payload.academic_year_id,
            term_id: payload.term_id,
            status: 'DRAFT',
            created_by: userId
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateStatus(sessionId, status) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', sessionId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.ResultRepository = ResultRepository;
exports.default = ResultRepository;
