"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentNumberService = void 0;
const supabase_1 = require("../../../config/supabase");
class DocumentNumberService {
    /**
     * Generates a sequential document number.
     * Format: TYPE-YYYY-000001
     */
    static async generateNextNumber(type, schoolId) {
        const year = new Date().getFullYear();
        const prefix = `${type}-${year}-`;
        let count = 0;
        try {
            if (type === 'DEM') {
                const { count: c, error } = await supabase_1.supabase
                    .from('fee_demands')
                    .select('*', { count: 'exact', head: true });
                if (error)
                    throw error;
                count = c || 0;
            }
            else if (type === 'RCPT') {
                const { count: c, error } = await supabase_1.supabase
                    .from('fee_receipts')
                    .select('*', { count: 'exact', head: true });
                if (error)
                    throw error;
                count = c || 0;
            }
            else if (type === 'WVR') {
                const { count: c, error } = await supabase_1.supabase
                    .from('fee_waiver_requests')
                    .select('*', { count: 'exact', head: true });
                if (error)
                    throw error;
                count = c || 0;
            }
            else if (type === 'RFND') {
                const { count: c, error } = await supabase_1.supabase
                    .from('fee_refunds')
                    .select('*', { count: 'exact', head: true });
                if (error)
                    throw error;
                count = c || 0;
            }
        }
        catch (err) {
            console.error(`[DocumentNumberService] Failed to fetch count for ${type}:`, err);
            count = Math.floor(Math.random() * 1000);
        }
        const sequenceStr = String(count + 1).padStart(6, '0');
        return `${prefix}${sequenceStr}`;
    }
}
exports.DocumentNumberService = DocumentNumberService;
