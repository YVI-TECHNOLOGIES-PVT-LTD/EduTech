import { Request, Response, NextFunction } from 'express';
import { auditService } from '../modules/admission';

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Only capture mutation requests (POST, PUT, DELETE, PATCH)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const userId = req.context?.user?.id || null;
        const userEmail = req.context?.user?.email || 'anonymous';
        const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;
        
        // Extract basic entity type from URL segments
        const segments = req.originalUrl.split('/').filter(Boolean);
        const entityName = segments.length > 0 ? segments[segments.length - 1] : 'unknown';

        // We run audit logging asynchronously so we don't block the API response
        auditService.logAudit({
            userId,
            action: `${req.method}_${req.originalUrl.toUpperCase()}`,
            entityName,
            entityId: req.body?.id || req.params?.id || 'none',
            afterState: req.body || null,
            ipAddress: ipAddress || undefined,
            userAgent: userAgent || undefined,
            correlationId: (req.headers['x-correlation-id'] as string) || undefined
        }).catch(err => {
            console.error('[Audit Middleware] Failed to record log:', err);
        });
    }
    next();
};
