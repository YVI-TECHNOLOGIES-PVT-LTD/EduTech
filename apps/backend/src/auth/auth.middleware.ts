import { Request, Response, NextFunction } from 'express';
import { sessionService } from './session.service';

declare global {
    namespace Express {
        interface Request {
            context?: {
                user: {
                    id: string;
                    email: string;
                    school_id: string;
                    roles: string[];
                    permissions: string[];
                    login_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
                };
                token: string;
            };
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    console.log(`[AuthMiddleware] Header present: ${!!authHeader}, StartsWithBearer: ${authHeader?.startsWith('Bearer ')}`);

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const userProfile = await sessionService.validateSession(token);

        if (!userProfile) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        req.context = {
            user: {
                id: userProfile.id,
                email: userProfile.email,
                school_id: userProfile.school_id,
                roles: userProfile.roles,
                permissions: userProfile.permissions,
                login_status: userProfile.login_status
            },
            token
        };

        next();
    } catch (error) {
        console.error('Authentication Error:', error);
        return res.status(401).json({ error: 'Authentication failed' });
    }
};
export const authenticateOptional = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];

    try {
        const userProfile = await sessionService.validateSession(token);

        if (userProfile) {
            req.context = {
                user: {
                    id: userProfile.id,
                    email: userProfile.email,
                    school_id: userProfile.school_id,
                    roles: userProfile.roles,
                    permissions: userProfile.permissions,
                    login_status: userProfile.login_status
                },
                token
            };
        }
        next();
    } catch (error) {
        // Silently continue for optional auth
        next();
    }
};

export const checkLoginApproval = (req: Request, res: Response, next: NextFunction) => {
    const user = req.context?.user;
    if (!user) return next();

    // Admins and Faculty are always approved bypass (Staff)
    if (user.roles.some(r => ['ADMIN', 'FACULTY', 'HEAD_OF_INSTITUTE'].includes(r))) return next();

    if (user.login_status !== 'APPROVED') {
        const allowedPaths = [
            '/me',
            '/admissions/my',
            '/v1/admission/my',
            '/v1/admission/application/my',
            '/v1/admission/application',
            '/v1/admission/public-apply',
            '/v1/admission/apply',
            '/v1/admission/assessment',
        ];
        const isAllowed = allowedPaths.some(path => req.path === path || req.path.startsWith(path + '/'));

        // Legacy and CRM application detail views for pending-login parents
        if (req.path.match(/^\/admissions\/[0-9a-f-]{36}$/)) {
            return next();
        }
        if (req.path.match(/^\/v1\/admission\/application\/[0-9a-f-]{36}(\/|$)/)) {
            return next();
        }

        if (!isAllowed) {
            return res.status(403).json({
                error: 'Account login pending approval',
                login_status: user.login_status
            });
        }
    }

    next();
};
