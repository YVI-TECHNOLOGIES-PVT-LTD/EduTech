"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranscriptRequestRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class TranscriptRequestRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('transcript_requests');
    }
    async createRequest(studentId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            student_id: studentId,
            status: 'Requested'
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async updateStatus(requestId, status) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .update({ status, updated_at: new Date() })
            .eq('id', requestId)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.TranscriptRequestRepository = TranscriptRequestRepository;
exports.default = TranscriptRequestRepository;
