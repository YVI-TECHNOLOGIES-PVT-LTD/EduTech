"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class ModerationRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_moderation_queue');
    }
    async getQueue(schoolId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .select('*, session:assessment_evaluation_sessions(*)')
            .eq('session.school_id', schoolId)
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data || [];
    }
    async queueForModeration(sessionId, firstMarks, secondMarks, variance) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            session_id: sessionId,
            first_evaluator_marks: firstMarks,
            second_evaluator_marks: secondMarks,
            variance_pct: variance,
            status: 'PENDING'
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async resolveModeration(queueId, moderatorId, moderatorMarks, status) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update({
            moderator_id: moderatorId,
            moderator_marks: moderatorMarks,
            status
        })
            .eq('id', queueId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.ModerationRepository = ModerationRepository;
exports.default = ModerationRepository;
