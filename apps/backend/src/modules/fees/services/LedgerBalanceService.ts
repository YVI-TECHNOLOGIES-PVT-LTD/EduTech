import { supabase } from '../../../config/supabase';

export class LedgerBalanceService {
    /**
     * Gets the latest running balance for a student or application.
     */
    public static async getBalance(target: { student_id?: string; application_id?: string }): Promise<number> {
        let query = supabase
            .from('student_fee_ledger')
            .select('running_balance')
            .order('created_at', { ascending: false })
            .limit(1);

        if (target.student_id) {
            query = query.eq('student_id', target.student_id);
        } else if (target.application_id) {
            query = query.eq('application_id', target.application_id);
        } else {
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
    public static async getLedgerHistory(target: { student_id?: string; application_id?: string }) {
        let query = supabase
            .from('student_fee_ledger')
            .select('*')
            .order('created_at', { ascending: true });

        if (target.student_id) {
            query = query.eq('student_id', target.student_id);
        } else if (target.application_id) {
            query = query.eq('application_id', target.application_id);
        } else {
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
