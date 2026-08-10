"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLoginApproval = exports.authenticateOptional = exports.authenticate = void 0;
const session_service_1 = require("./session.service");
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log(`[AuthMiddleware] Header present: ${!!authHeader}, StartsWithBearer: ${authHeader?.startsWith('Bearer ')}`);
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const userProfile = await session_service_1.sessionService.validateSession(token);
        if (!userProfile) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }
        req.context = {
            user: {
                id: userProfile.id,
                email: userProfile.email,
                org_id: userProfile.org_id || userProfile.school_id,
                school_id: userProfile.school_id || userProfile.org_id,
                roles: userProfile.roles,
                permissions: userProfile.permissions,
                login_status: userProfile.login_status
            },
            token
        };
        next();
    }
    catch (error) {
        console.error('Authentication Error:', error);
        return res.status(401).json({ error: 'Authentication failed' });
    }
};
exports.authenticate = authenticate;
const authenticateOptional = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next();
    }
    const token = authHeader.split(' ')[1];
    try {
        const userProfile = await session_service_1.sessionService.validateSession(token);
        if (userProfile) {
            req.context = {
                user: {
                    id: userProfile.id,
                    email: userProfile.email,
                    org_id: userProfile.org_id || userProfile.school_id,
                    school_id: userProfile.school_id || userProfile.org_id,
                    roles: userProfile.roles,
                    permissions: userProfile.permissions,
                    login_status: userProfile.login_status
                },
                token
            };
        }
        next();
    }
    catch (error) {
        // Silently continue for optional auth
        next();
    }
};
exports.authenticateOptional = authenticateOptional;
const checkLoginApproval = (req, res, next) => {
    const user = req.context?.user;
    if (!user)
        return next();
    // Admins and Faculty are always approved bypass (Staff)
    if (user.roles.some(r => ['ADMIN', 'FACULTY', 'HEAD_OF_INSTITUTE'].includes(r)))
        return next();
    if (user.login_status !== 'APPROVED') {
        const allowedPaths = [
            '/me',
            '/admissions/my',
            '/v1/admission/my',
            '/v1/admission/application/my',
            '/v1/admission/application',
            '/v1/admission/public-apply',
            '/v1/admission/apply',
            '/v1/admission/crm/enquiries',
            '/v1/admission/enquiries',
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
exports.checkLoginApproval = checkLoginApproval;
