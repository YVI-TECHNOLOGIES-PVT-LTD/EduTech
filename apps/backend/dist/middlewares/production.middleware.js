"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockInProduction = void 0;
const env_1 = require("../config/env");
const supabase_1 = require("../config/supabase");
const blockInProduction = async (req, res, next) => {
    if (env_1.env.SYSTEM_MODE === 'PRODUCTION') {
        const userId = req.context?.user?.id || 'ANONYMOUS';
        const userRole = req.context?.user?.roles?.[0] || 'NONE';
        console.warn(`[Lockdown] Blocked ${req.method} ${req.path} for user ${userId} (${userRole})`);
        try {
            await supabase_1.supabase.from('academic_automation_logs').insert({
                school_id: req.context?.user?.school_id,
                action: 'BLOCKED_OPERATION',
                details: {
                    user_id: userId,
                    role: userRole,
                    endpoint: req.originalUrl,
                    reason: 'PROD_LOCKDOWN'
                },
                performed_by: userId
            });
        }
        catch (err) {
            console.error('[Lockdown] Failed to log blocked operation:', err);
        }
        return res.status(403).json({
            error: "This operation is BLOCKED in Production mode. PROD_LOCKDOWN initiated."
        });
    }
    next();
};
exports.blockInProduction = blockInProduction;
