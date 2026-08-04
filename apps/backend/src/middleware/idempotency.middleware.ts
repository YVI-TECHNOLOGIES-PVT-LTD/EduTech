import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

/**
 * Express middleware to enforce request idempotency via an Idempotency-Key header,
 * storing execution state in the public.request_tracking table.
 */
export async function checkIdempotency(req: Request, res: Response, next: NextFunction) {
    const key = req.headers['idempotency-key'] as string;
    if (!key) {
        return next();
    }

    try {
        // Consult request tracking cache
        const { data, error } = await supabase
            .from('request_tracking')
            .select('*')
            .eq('idempotency_key', key)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            if (data.status === 'PROCESSING') {
                return res.status(409).json({ error: 'Request is already being processed. Please wait.' });
            }
            if (data.status === 'COMPLETED') {
                return res.status(data.response_code).json(data.response_body);
            }
        }

        // Lock key state to PROCESSING
        const userId = req.context?.user?.id || null;
        const { error: insErr } = await supabase
            .from('request_tracking')
            .insert({
                idempotency_key: key,
                module: 'admission',
                operation: `${req.method} ${req.path}`,
                user_id: userId,
                status: 'PROCESSING',
                response_code: 200,
                response_body: {}
            });

        if (insErr) {
            if (insErr.code === '23505') { // Unique constraint violation (duplicate key)
                return res.status(409).json({ error: 'Duplicate idempotency key' });
            }
            throw insErr;
        }

        // Intercept response payload to cache it
        const originalJson = res.json;
        res.json = function (body: any) {
            res.json = originalJson;

            // Sync database tracking log to COMPLETED
            supabase
                .from('request_tracking')
                .update({
                    status: 'COMPLETED',
                    response_code: res.statusCode,
                    response_body: body
                })
                .eq('idempotency_key', key)
                .then(({ error: updErr }) => {
                    if (updErr) console.error('[Idempotency] Update failed:', updErr.message);
                });

            return originalJson.call(this, body);
        };

        next();
    } catch (err: any) {
        console.error('[Idempotency] Middleware exception:', err);
        next();
    }
}
