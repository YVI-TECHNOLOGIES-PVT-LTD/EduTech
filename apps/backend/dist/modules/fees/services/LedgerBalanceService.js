"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerBalanceService = void 0;
const supabase_1 = require("../../../config/supabase");
class LedgerBalanceService {
    /**
     * Gets the latest running balance for a student or application.
     */
    static async getBalance(target) {
        let query = supabase_1.supabase
            .from('student_fee_ledger')
            .select('running_balance')
            .order('created_at', { ascending: false })
            .limit(1);
        if (target.student_id) {
            query = query.eq('student_id', target.student_id);
        }
        else if (target.application_id) {
            query = query.eq('application_id', target.application_id);
        }
        else {
            return 0;
        }
        const { data, error } = await query;
        if (error) {
            console.error('[LedgerBalanceService] Error fetching balance:', error);
            return 0;
        }
        return data && data.length > 0 ? Number(data[0].running_balance) : 0;
    }
    /**
     * Retrieves the chronological ledger history.
     */
    static async getLedgerHistory(target) {
        let query = supabase_1.supabase
            .from('student_fee_ledger')
            .select('*')
            .order('created_at', { ascending: true });
        if (target.student_id) {
            query = query.eq('student_id', target.student_id);
        }
        else if (target.application_id) {
            query = query.eq('application_id', target.application_id);
        }
        else {
            return [];
        }
        const { data, error } = await query;
        if (error) {
            console.error('[LedgerBalanceService] Error fetching history:', error);
            return [];
        }
        return data || [];
    }
}
exports.LedgerBalanceService = LedgerBalanceService;
