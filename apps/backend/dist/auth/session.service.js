"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionService = exports.SessionService = void 0;
const prismaClient_1 = __importDefault(require("../lib/prismaClient"));
const auth_service_1 = require("./auth.service");
const logger_1 = require("../utils/logger");
const sessionCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL
class SessionService {
    /**
     * Deterministic Role Normalization
     * Maps raw database role strings or user-assigned strings to canonical runtime roles.
     */
    static normalizeRoleName(rawRole) {
        if (!rawRole || typeof rawRole !== 'string')
            return '';
        const trimmed = rawRole.trim();
        const lower = trimmed.toLowerCase().replace(/[\s\-_]+/g, '');
        if (lower === 'frontoffice' ||
            lower === 'receptionist' ||
            lower === 'admissionofficer' ||
            lower === 'admissionsofficer' ||
            lower === 'frontofficeexecutive' ||
            lower === 'frontofficestaff' ||
            lower === 'admissionsdesk') {
            return 'FRONT_OFFICE';
        }
        if (lower === 'parent' || lower === 'guardian') {
            return 'PARENT';
        }
        if (lower === 'superadmin' || lower === 'superadministrator' || lower === 'super_admin') {
            return 'SUPERADMIN';
        }
        if (lower === 'admin' ||
            lower === 'administrator' ||
            lower === 'orgadmin' ||
            lower === 'org_admin') {
            return 'ADMIN';
        }
        if (lower === 'counselor' || lower === 'counsellor') {
            return 'COUNSELLOR';
        }
        if (lower === 'hoi' || lower === 'headofinstitute' || lower === 'principal') {
            return 'HOI';
        }
        if (lower === 'financemanager' || lower === 'financehead' || lower === 'financeadmin') {
            return 'FINANCE_MANAGER';
        }
        if (lower === 'finance' || lower === 'financeofficer' || lower === 'bursar') {
            return 'FINANCE_OFFICER';
        }
        if (lower === 'accountant' ||
            lower === 'cashier' ||
            lower === 'accountsclerk' ||
            lower === 'bookkeeper') {
            return 'ACCOUNTANT';
        }
        if (lower === 'staff' || lower === 'faculty') {
            return 'STAFF';
        }
        return trimmed.toUpperCase().replace(/\s+/g, '_');
    }
    async validateSession(token) {
        const cached = sessionCache.get(token);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.profile;
        }
        try {
            // 1. Verify Internal JWT Token
            const decoded = auth_service_1.AuthService.verifyToken(token);
            if (!decoded || !decoded.userId)
                return null;
            // 2. Fetch User Profile from public.users via Prisma ORM
            const user = await prismaClient_1.default.users.findUnique({
                where: { user_id: decoded.userId },
                include: { countries: true },
            });
            if (!user || user.status !== 'active') {
                return null;
            }
            // 3. Fetch Roles & Permissions via Prisma ORM using exact schema columns (role_id, role_name, is_active)
            const roles = [];
            const permissions = new Set();
            try {
                const userRolesPrisma = await prismaClient_1.default.user_roles.findMany({
                    where: { user_id: user.user_id },
                    include: { roles: true },
                });
                for (const ur of userRolesPrisma) {
                    if (ur.roles && ur.roles.is_active !== false) {
                        const canonical = SessionService.normalizeRoleName(ur.roles.role_name);
                        if (canonical && !roles.includes(canonical)) {
                            roles.push(canonical);
                        }
                    }
                }
            }
            catch (e) {
                logger_1.logger.warn(`[SessionService] Error loading user_roles for user ${user.user_id}`, {
                    error: e?.message || String(e),
                });
            }
            // 4. Fallback to JWT claims if DB user_roles returns empty
            if (roles.length === 0 && decoded.roles && Array.isArray(decoded.roles)) {
                for (const r of decoded.roles) {
                    const canonical = SessionService.normalizeRoleName(r);
                    if (canonical && !roles.includes(canonical)) {
                        roles.push(canonical);
                    }
                }
            }
            // 5. Parent record & enrollment check
            let hasEnrolledStudent = false;
            let parentRecord = null;
            try {
                parentRecord = await prismaClient_1.default.parents.findFirst({
                    where: { user_id: user.user_id },
                    include: {
                        student_parents: {
                            include: {
                                students: {
                                    select: { student_id: true, status: true },
                                },
                            },
                        },
                    },
                });
            }
            catch (e) {
                logger_1.logger.warn(`[SessionService] Error loading parent record for user ${user.user_id}`);
            }
            if (parentRecord) {
                if (!roles.includes('PARENT')) {
                    roles.push('PARENT');
                }
                hasEnrolledStudent = (parentRecord.student_parents || []).some((sp) => sp.students && sp.students.status === 'active');
                if (hasEnrolledStudent && !roles.includes('ENROLLED_PARENT')) {
                    roles.push('ENROLLED_PARENT');
                }
            }
            // 6. FAIL-CLOSED RULE: If user has no valid active role, reject session!
            // (DO NOT silently default unknown staff/admin users to PARENT)
            if (roles.length === 0) {
                logger_1.logger.warn(`[SessionService] Fail-closed: User ${user.user_id} (${user.email}) has no valid active roles. Session rejected.`);
                return null;
            }
            // 7. Inject Stage-1 Persona Permissions
            if (roles.includes('PARENT')) {
                permissions.add('admission.view_own');
                permissions.add('admission.create');
                permissions.add('admission.application.view_own');
                permissions.add('admission.application.create');
                permissions.add('admission.application.update');
                permissions.add('admission.application.view');
                permissions.add('DASHBOARD_VIEW_PARENT');
                permissions.add('fees.my.view');
                permissions.add('fees.view');
                if (hasEnrolledStudent || roles.includes('ENROLLED_PARENT')) {
                    permissions.add('fees.payment.view');
                    permissions.add('fees.payment.collect');
                    permissions.add('fees.receipt.generate');
                    permissions.add('communication.view');
                    permissions.add('helpdesk.view');
                }
            }
            if (roles.some((r) => [
                'SUPERADMIN',
                'SUPER_ADMIN',
                'ADMIN',
                'ORG_ADMIN',
                'FRONT_OFFICE',
                'RECEPTIONIST',
                'ADMISSION_OFFICER',
                'ADMISSIONS_OFFICER',
                'COUNSELLOR',
                'COUNSELOR',
                'STAFF',
                'FACULTY',
                'HOI',
                'HEAD_OF_INSTITUTE',
                'PRINCIPAL',
                'EXAM_CELL_ADMIN',
                'EXAM_CELL',
            ].includes(r))) {
                permissions.add('admission.create');
                permissions.add('admission.view_all');
                permissions.add('admission.review');
                permissions.add('admission.recommend');
                permissions.add('admission.approve');
                permissions.add('admission.assessment.evaluate');
                permissions.add('admission.assessment.config.manage');
                permissions.add('admission.assessment.dashboard.view');
                permissions.add('admission.document.view');
                permissions.add('admission.document.verify');
                permissions.add('admission.application.view');
                permissions.add('admission.application.create');
                permissions.add('admission.application.update');
                permissions.add('admission.application.delete');
                permissions.add('admission.enquiry.view');
                permissions.add('admission.enquiry.create');
                permissions.add('admission.leads.manage');
                permissions.add('admission.visitors.manage');
                permissions.add('admission.enrol');
                permissions.add('STUDENT_CREATE');
                permissions.add('STUDENT_VIEW');
                permissions.add('STUDENT_UPDATE');
                permissions.add('STUDENT_ASSIGN_SECTION');
                permissions.add('admin.dashboard.view');
                permissions.add('fees.view');
                permissions.add('fees.payment.collect');
                permissions.add('fees.receipt.generate');
                permissions.add('fees.payment.view');
                permissions.add('admission.fees.initialize');
            }
            // Stage-1 Finance Persona Permissions
            if (roles.some((r) => ['FINANCE_OFFICER', 'FINANCE', 'FINANCE_MANAGER'].includes(r))) {
                permissions.add('fees.dashboard.view');
                permissions.add('fees.view');
                permissions.add('fees.structure.view');
                permissions.add('fees.structure.manage');
                permissions.add('fees.demand.view');
                permissions.add('fees.demand.generate');
                permissions.add('fees.payment.view');
                permissions.add('fees.payment.collect');
                permissions.add('fees.receipt.generate');
                permissions.add('fees.waiver.approve');
                permissions.add('fees.refund.process');
            }
            else if (roles.includes('ACCOUNTANT')) {
                // Operational Accountant: Ledger, demands, and payment processing
                permissions.add('fees.dashboard.view');
                permissions.add('fees.view');
                permissions.add('fees.structure.view');
                permissions.add('fees.demand.view');
                permissions.add('fees.demand.generate');
                permissions.add('fees.payment.view');
                permissions.add('fees.payment.collect');
                permissions.add('fees.receipt.generate');
            }
            const profile = {
                id: user.user_id,
                email: user.email,
                phone: user.phone,
                country_id: user.country_id,
                country_code: user.countries?.country_code || 'IN',
                calling_code: user.countries?.calling_code || '+91',
                country: user.countries || null,
                org_id: user.org_id,
                school_id: user.org_id,
                full_name: `${user.first_name} ${user.last_name || ''}`.trim(),
                roles,
                permissions: Array.from(permissions),
                login_status: 'APPROVED',
                hasEnrolledStudent,
                isPostAdmission: hasEnrolledStudent || roles.includes('ENROLLED_PARENT'),
            };
            sessionCache.set(token, {
                profile,
                expiresAt: Date.now() + CACHE_TTL_MS,
            });
            return profile;
        }
        catch (err) {
            logger_1.logger.error('[SessionService] Session validation failed', {
                error: err?.message || String(err),
            });
            return null;
        }
    }
}
exports.SessionService = SessionService;
exports.sessionService = new SessionService();
