"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranscriptRepository = void 0;
const supabase_1 = require("../../../../config/supabase");
const BaseRepository_1 = require("../../../admission/repositories/BaseRepository");
class TranscriptRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super('assessment_transcripts');
    }
    async createTranscript(studentId, recordJson, isOfficial = false, userId) {
        const { data, error } = await supabase_1.supabase
            .from(this.tableName)
            .insert({
            student_id: studentId,
            academic_record_json: recordJson,
            is_official: isOfficial,
            issued_by: userId
        })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.TranscriptRepository = TranscriptRepository;
exports.default = TranscriptRepository;
