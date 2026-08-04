"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamEvaluationController = void 0;
const supabase_1 = require("../../../config/supabase");
exports.ExamEvaluationController = {
    /**
     * Lock Results for a specific subject schedule
     * Prevents further marks entry.
     */
    async lockSubject(req, res) {
        const userId = req.context.user.id;
        try {
            const { scheduleId } = req.body;
            if (!scheduleId)
                return res.status(400).json({ error: "scheduleId required" });
            // 1. Verify all students have marks? (Optionally check if marks count matches seating count)
            // Senior Architect: We allow locking even if incomplete if admin accepts it.
            // 2. Atomic RPC call
            const { error } = await supabase_1.supabase.rpc('fn_lock_exam_subject', {
                p_schedule_id: scheduleId,
                p_performed_by: userId
            });
            if (error)
                throw error;
            res.json({ success: true, message: "Subject marks finalized and locked." });
        }
        catch (err) {
            console.error("Lock Subject Error:", err);
            res.status(500).json({ error: err.message });
        }
    },
    /**
     * Unlock Subject (Restricted Override)
     */
    async unlockSubject(req, res) {
        const userId = req.context.user.id;
        const { reason } = req.body;
        const { id } = req.params;
        if (!reason)
            return res.status(400).json({ error: "Reason required for unlock override." });
        try {
            const { error } = await supabase_1.supabase
                .from('exam_schedules')
                .update({
                results_locked: false,
                results_locked_at: null,
                results_locked_by: null
            })
                .eq('id', id);
            if (error)
                throw error;
            // Audit
            await supabase_1.supabase.from('academic_automation_logs').insert({
                action: 'EXAM_SUBJECT_UNLOCKED',
                details: { schedule_id: id, reason },
                performed_by: userId
            });
            res.json({ success: true });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
};
