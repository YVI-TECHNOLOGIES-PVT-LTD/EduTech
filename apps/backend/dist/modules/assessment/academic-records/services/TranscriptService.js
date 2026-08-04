"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranscriptService = void 0;
const BaseService_1 = require("../../../admission/services/BaseService");
const supabase_1 = require("../../../../config/supabase");
const crypto_1 = require("crypto");
class TranscriptService extends BaseService_1.BaseService {
    async generateOfficialTranscript(studentId, userId, correlationId) {
        this.logInfo(`Compiling consolidated academic records transcript for student: ${studentId}`, correlationId);
        // Fetch student's record details
        const { data: record } = await supabase_1.supabase
            .from('student_academic_records')
            .select('*')
            .eq('student_id', studentId)
            .maybeSingle();
        if (!record)
            throw new Error('Permanent academic record profile not created.');
        const transcriptUrl = `/exports/transcript_${studentId}_signed.pdf`;
        const { data: transcript, error } = await supabase_1.supabase
            .from('official_transcripts')
            .insert({
            student_id: studentId,
            pdf_url: transcriptUrl,
            is_official: true
        })
            .select()
            .single();
        if (error)
            throw error;
        // Log COE signature hashes
        const sigHash = (0, crypto_1.createHash)('sha256').update(transcript.id + userId).digest('hex');
        await supabase_1.supabase
            .from('transcript_signatures')
            .insert({
            transcript_id: transcript.id,
            signatory_role: 'COE',
            signed_hash: sigHash
        });
        // Set version registry
        await supabase_1.supabase
            .from('transcript_versions')
            .insert({
            transcript_id: transcript.id,
            version_number: 1,
            snapshot_hash: sigHash
        });
        return transcript;
    }
}
exports.TranscriptService = TranscriptService;
exports.default = TranscriptService;
