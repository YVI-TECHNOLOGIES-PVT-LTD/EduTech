import { supabase } from '../../../config/supabase';

export class SettingsService {

    public static async getSettings(schoolId: string) {
        const { data, error } = await supabase
            .from('finance_settings')
            .select('*')
            .eq('school_id', schoolId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        // Return defaults if not yet configured
        if (!data) {
            return {
                school_id: schoolId,
                receipt_prefix: 'RCPT',
                demand_prefix: 'DEM',
                currency: 'INR',
                currency_symbol: '₹',
                late_fee_enabled: false,
                late_fee_percentage: 0,
                grace_days: 0,
                default_payment_window_days: 30,
                receipt_footer: null,
                school_year_label: null,
                updated_at: null
            };
        }

        return data;
    }

    public static async upsertSettings(schoolId: string, updates: {
        receipt_prefix?: string;
        demand_prefix?: string;
        currency?: string;
        currency_symbol?: string;
        late_fee_enabled?: boolean;
        late_fee_percentage?: number;
        grace_days?: number;
        default_payment_window_days?: number;
        receipt_footer?: string;
        school_year_label?: string;
        updated_by?: string;
    }) {
        const { data, error } = await supabase
            .from('finance_settings')
            .upsert({
                school_id: schoolId,
                ...updates,
                updated_at: new Date().toISOString()
            }, { onConflict: 'school_id' })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
