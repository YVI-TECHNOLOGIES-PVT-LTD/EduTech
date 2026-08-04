"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerPostingService = void 0;
const supabase_1 = require("../../../config/supabase");
class LedgerPostingService {
    /**
     * Posts a new entry into the student fee ledger and computes the running balance.
     */
    static async postEntry(params) {
        let query = supabase_1.supabase
            .from('student_fee_ledger')
            .select('running_balance')
            .order('created_at', { ascending: false })
            .limit(1);
        if (params.student_id) {
            query = query.eq('student_id', params.student_id);
        }
        else if (params.application_id) {
            query = query.eq('application_id', params.application_id);
        }
        else {
            throw new Error('Ledger entry must reference student_id or application_id');
        }
        const { data: prev, error: prevErr } = await query;
        if (prevErr) {
            console.error('[LedgerPostingService] Error fetching previous balance:', prevErr);
        }
        const prevBalance = prev && prev.length > 0 ? Number(prev[0].running_balance) : 0;
        // Debit increases outstanding (student owes more), Credit reduces it.
        const running_balance = prevBalance + Number(params.debit) - Number(params.credit);
        const { error } = await supabase_1.supabase
            .from('student_fee_ledger')
            .insert({
            application_id: params.application_id || null,
            student_id: params.student_id || null,
            school_id: params.school_id || null,
            transaction_type: params.transaction_type,
            debit: params.debit,
            credit: params.credit,
            running_balance,
            reference_type: params.reference_type,
            reference_id: params.reference_id,
            description: params.description || null,
            performed_by: params.performed_by || null
        });
        if (error) {
            console.error('[LedgerPostingService] Error inserting ledger entry:', error);
            throw error;
        }
    }
}
exports.LedgerPostingService = LedgerPostingService;
