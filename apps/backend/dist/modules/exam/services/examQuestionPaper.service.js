"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamQuestionPaperService = void 0;
const supabase_1 = require("../../../config/supabase");
exports.ExamQuestionPaperService = {
    async uploadPaper(examScheduleId, userId, fileUrl, fileName, status = 'DRAFT') {
        // 1. Check if finalized/locked
        const { data: existing } = await supabase_1.supabase
            .from('exam_question_papers')
            .select('*')
            .eq('exam_schedule_id', examScheduleId)
            .order('version', { ascending: false })
            .limit(1)
            .single();
        if (existing?.status === 'LOCKED') {
            throw new Error("Question paper is LOCKED. Cannot upload new version.");
        }
        const newVersion = (existing?.version || 0) + 1;
        // 2. Insert new version
        const { data, error } = await supabase_1.supabase
            .from('exam_question_papers')
            .insert({
            exam_schedule_id: examScheduleId,
            uploaded_by: userId,
            file_url: fileUrl,
            file_name: fileName,
            version: newVersion,
            status
        })
            .select()
            .single();
        if (error)
            throw error;
        // 3. Log Audit
        await supabase_1.supabase.from('exam_audit_logs').insert({
            entity_type: 'QUESTION_PAPER',
            entity_id: data.id,
            action: 'UPLOAD',
            performed_by: userId,
            reason: `Uploaded version ${newVersion} as ${status}`
        });
        return data;
    },
    async lockPaper(examScheduleId, userId) {
        // 1. Get latest
        const { data: latest } = await supabase_1.supabase
            .from('exam_question_papers')
            .select('*')
            .eq('exam_schedule_id', examScheduleId)
            .order('version', { ascending: false })
            .limit(1)
            .single();
        if (!latest)
            throw new Error("No paper found to lock.");
        if (latest.status === 'LOCKED')
            return latest; // Idempotent
        // 2. Update status
        const { data, error } = await supabase_1.supabase
            .from('exam_question_papers')
            .update({
            status: 'LOCKED',
            locked_at: new Date().toISOString()
        })
            .eq('id', latest.id)
            .select()
            .single();
        if (error)
            throw error;
        // 3. Log Audit
        await supabase_1.supabase.from('exam_audit_logs').insert({
            entity_type: 'QUESTION_PAPER',
            entity_id: latest.id,
            action: 'LOCK',
            performed_by: userId,
            reason: `Locked version ${latest.version} by admin`
        });
        return data;
    },
    async getPapers(examScheduleId) {
        const { data, error } = await supabase_1.supabase
            .from('exam_question_papers')
            .select(`
                *,
                uploader:uploaded_by(email) -- Only email if profile not available
            `)
            .eq('exam_schedule_id', examScheduleId)
            .order('version', { ascending: false });
        if (error)
            throw error;
        return data;
    }
};
