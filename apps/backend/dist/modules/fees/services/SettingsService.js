"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const supabase_1 = require("../../../config/supabase");
class SettingsService {
    static async getSettings(schoolId) {
        const { data, error } = await supabase_1.supabase
            .from('finance_settings')
            .select('*')
            .eq('school_id', schoolId)
            .single();
        if (error && error.code !== 'PGRST116')
            throw error;
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
    static async upsertSettings(schoolId, updates) {
        const { data, error } = await supabase_1.supabase
            .from('finance_settings')
            .upsert({
            school_id: schoolId,
            ...updates,
            updated_at: new Date().toISOString()
        }, { onConflict: 'school_id' })
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
}
exports.SettingsService = SettingsService;
