"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamVersioningService = void 0;
const supabase_1 = require("../../../config/supabase");
exports.ExamVersioningService = {
    /**
     * Get all seating versions for an exam
     */
    async getSeatingVersions(examId) {
        const { data, error } = await supabase_1.supabase
            .from('exam_seating_versions')
            .select('id, version_number, revised_at, revision_reason, revised_by, user:revised_by(full_name)')
            .eq('exam_id', examId)
            .order('version_number', { ascending: false });
        if (error)
            throw error;
        return data;
    },
    /**
     * Get all result versions for an exam
     */
    async getResultVersions(examId) {
        const { data, error } = await supabase_1.supabase
            .from('exam_result_versions')
            .select('id, version_number, revised_at, revision_reason, revised_by, user:revised_by(full_name)')
            .eq('exam_id', examId)
            .order('version_number', { ascending: false });
        if (error)
            throw error;
        return data;
    },
    /**
     * Restore a specific seating version
     */
    async restoreSeatingVersion(examId, versionNumber, userId) {
        const { error } = await supabase_1.supabase.rpc('fn_restore_seating_version', {
            p_exam_id: examId,
            p_version_number: versionNumber,
            p_user_id: userId
        });
        if (error) {
            console.error("Seating version restoration failed:", error);
            if (error.message?.includes('EXAM_COMPLETED'))
                throw new Error("EXAM_COMPLETED: Cannot restore seating for a finalized exam.");
            if (error.message?.includes('VERSION_NOT_FOUND'))
                throw new Error("VERSION_NOT_FOUND: Version " + versionNumber + " not found.");
            throw error;
        }
        return { success: true };
    }
};
