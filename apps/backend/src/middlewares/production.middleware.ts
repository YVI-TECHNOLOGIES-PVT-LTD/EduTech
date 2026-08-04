import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { supabase } from '../config/supabase';

export const blockInProduction = async (req: Request, res: Response, next: NextFunction) => {
    if (env.SYSTEM_MODE === 'PRODUCTION') {
        const userId = req.context?.user?.id || 'ANONYMOUS';
        const userRole = req.context?.user?.roles?.[0] || 'NONE';

        console.warn(`[Lockdown] Blocked ${req.method} ${req.path} for user ${userId} (${userRole})`);

        try {
            await supabase.from('academic_automation_logs').insert({
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
        } catch (err) {
            console.error('[Lockdown] Failed to log blocked operation:', err);
        }

        return res.status(403).json({
            error: "This operation is BLOCKED in Production mode. PROD_LOCKDOWN initiated."
        });
    }
    next();
};
