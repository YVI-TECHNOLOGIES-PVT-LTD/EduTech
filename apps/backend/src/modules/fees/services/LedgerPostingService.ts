import { supabase } from '../../../config/supabase';

export class LedgerPostingService {
    /**
     * Posts a new entry into the student fee ledger and computes the running balance.
     */
    public static async postEntry(params: {
        application_id?: string | null;
        student_id?: string | null;
        school_id?: string | null;
        transaction_type: 'DEMAND' | 'PAYMENT' | 'WAIVER' | 'REFUND' | 'ADJUSTMENT' | 'SCHOLARSHIP' | 'WRITE_OFF' | 'REVERSAL' | 'PENALTY' | 'LATE_FEE';
        debit: number;
        credit: number;
        reference_type: 'FEE_DEMAND' | 'PAYMENT' | 'WAIVER' | 'REFUND' | 'ADJUSTMENT';
        reference_id: string;
        description?: string;
        performed_by?: string;
    }): Promise<void> {
        let query = supabase
            .from('student_fee_ledger')
            .select('running_balance')
            .order('created_at', { ascending: false })
            .limit(1);

        if (params.student_id) {
            query = query.eq('student_id', params.student_id);
        } else if (params.application_id) {
            query = query.eq('application_id', params.application_id);
        } else {
            throw new Error('Ledger entry must reference student_id or application_id');
        }

        const { data: prev, error: prevErr } = await query;
        if (prevErr) {
            console.error('[LedgerPostingService] Error fetching previous balance:', prevErr);
        }

        const prevBalance = prev && prev.length > 0 ? Number(prev[0].running_balance) : 0;

        // Debit increases outstanding (student owes more), Credit reduces it.
        const running_balance = prevBalance + Number(params.debit) - Number(params.credit);

        const { error } = await supabase
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
