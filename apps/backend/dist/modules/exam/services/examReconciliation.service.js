"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamEligibilityReconciliationService = void 0;
const supabase_1 = require("../../../config/supabase");
exports.ExamEligibilityReconciliationService = {
    /**
     * FUTURE USE ONLY (Do Not Enable Automatically)
     *
     * Responsibilities:
     * - Detect availability of REAL attendance + fee records
     * - Replace BOOTSTRAP snapshots with REAL snapshots where applicable
     * - Preserve audit trail
     *
     * @param examId
     */
    async reconcileExam(examId) {
        console.log(`[RECONCILIATION] Starting reconciliation for Exam: ${examId}`);
        // 1. Fetch Bootstrapped Snapshots
        const { data: snapshots } = await supabase_1.supabase
            .from('exam_eligibility_snapshots')
            .select('*')
            .eq('exam_id', examId)
            .eq('source', 'BOOTSTRAP');
        if (!snapshots || snapshots.length === 0) {
            console.log("[RECONCILIATION] No bootstrapped snapshots found.");
            return;
        }
        // 2. For each student, check if REAL data exists
        // This is a placeholder for the logic that would check `attendance_records` and `student_fees`
        // and if sufficient data exists, calculate the REAL values.
        console.warn("[RECONCILIATION] This service is currently a placeholder. No changes made.");
        /*
        // LOGIC SKETCH:
        for (const snap of snapshots) {
            const realData = await calculateRealEligibility(snap.student_id, examId);
            if (realData.hasData) {
                // Update SnapshotSource -> REAL
                // Update Snapshot Values
            }
        }
        */
    }
};
