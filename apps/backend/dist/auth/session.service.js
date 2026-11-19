"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionService = exports.SessionService = void 0;
const prismaClient_1 = __importDefault(require("../lib/prismaClient"));
const auth_service_1 = require("./auth.service");
const logger_1 = require("../utils/logger");
const role_normalization_1 = require("../rbac/role-normalization");
class SessionService {
    /**
     * Deterministic Role Normalization
     * Maps raw database role strings or user-assigned strings to canonical runtime roles.
     */
    static normalizeRoleName(rawRole) {
        return (0, role_normalization_1.normalizeRoleName)(rawRole);
    }
    /**
     * Canonical permission derivation from normalized runtime roles and child enrollment linkage.
     */
    static derivePermissions(roles, hasEnrolledStudent) {
        const permissions = new Set();
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
        if (roles.some((r) => role_normalization_1.ADMIN_DASHBOARD_ROLES.includes(r))) {
            permissions.add('DASHBOARD_VIEW_ADMIN');
            permissions.add('admin.dashboard.view');
        }
        if (roles.some((r) => ['TEACHER', 'FACULTY', ...role_normalization_1.ADMIN_DASHBOARD_ROLES].includes(r))) {
            permissions.add('DASHBOARD_VIEW_FACULTY');
            permissions.add('faculty.dashboard.view');
        }
        if (roles.some((r) => [
            'FRONT_OFFICE',
            'RECEPTIONIST',
            'ADMISSION_OFFICER',
            'ADMISSIONS_OFFICER',
            'COUNSELLOR',
            'COUNSELOR',
        ].includes(r))) {
            permissions.add('admission.dashboard.view');
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
            permissions.add('fees.view');
            permissions.add('fees.payment.collect');
            permissions.add('fees.receipt.generate');
            permissions.add('fees.payment.view');
            permissions.add('admission.fees.initialize');
        }
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
            permissions.add('fees.dashboard.view');
            permissions.add('fees.view');
            permissions.add('fees.structure.view');
            permissions.add('fees.demand.view');
            permissions.add('fees.demand.generate');
            permissions.add('fees.payment.view');
            permissions.add('fees.payment.collect');
            permissions.add('fees.receipt.generate');
        }
        if (roles.includes('STUDENT')) {
            permissions.add('student.dashboard.view');
            permissions.add('STUDENT_VIEW_SELF');
            permissions.add('admission.view_own');
            permissions.add('ATTENDANCE_VIEW_SELF');
            permissions.add('attendance.leave.apply');
            permissions.add('TRANSPORT_VIEW_SELF');
            permissions.add('TRIP_VIEW_SELF');
            permissions.add('CLASS_VIEW');
            permissions.add('SECTION_VIEW');
            permissions.add('SUBJECT_VIEW');
            permissions.add('TIMETABLE_VIEW');
            permissions.add('EXAM_VIEW');
            permissions.add('MARKS_VIEW');
            permissions.add('fees.view');
            permissions.add('fees.payment.view');
            permissions.add('assessment.attempt.write');
            permissions.add('assessment.attempt.view');
            permissions.add('assessment.result.view');
        }
        return Array.from(permissions);
    }
    /**
     * Authoritative stateless DB session & identity hydration by verified userId.
     * No in-memory RAM cache is retained so user suspensions, role updates, and
     * child/staff/student linkages reflect immediately across all instances.
     */
    async validateUserById(userId, fallbackTokenRoles) {
        try {
            const user = await prismaClient_1.default.users.findUnique({
                where: { user_id: userId },
                include: {
                    countries: true,
                    organizations_users_org_idToorganizations: {
                        select: { org_name: true, org_code: true },
                    },
                },
            });
            if (!user || user.status !== 'active') {
                return null;
            }
            const roles = [];
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const canQueryUuidRelations = uuidRegex.test(user.user_id) && uuidRegex.test(user.org_id);
            const [userRolesPrisma, staffRecord, studentRecord, parentRecord] = await Promise.all([
                prismaClient_1.default.user_roles.findMany({
                    where: { user_id: user.user_id },
                    include: { roles: true },
                }),
                canQueryUuidRelations
                    ? prismaClient_1.default.staff.findFirst({
                        where: { user_id: user.user_id, org_id: user.org_id, is_active: true },
                        select: { staff_id: true },
                    })
                    : Promise.resolve(null),
                canQueryUuidRelations
                    ? prismaClient_1.default.students.findFirst({
                        where: { user_id: user.user_id, org_id: user.org_id },
                        select: { student_id: true, status: true },
                    })
                    : Promise.resolve(null),
                canQueryUuidRelations
                    ? prismaClient_1.default.parents.findFirst({
                        where: { user_id: user.user_id, org_id: user.org_id },
                        include: {
                            student_parents: {
                                include: {
                                    students: {
                                        select: { student_id: true, status: true },
                                    },
                                },
                            },
                        },
                    })
                    : Promise.resolve(null),
            ]);
            for (const ur of userRolesPrisma) {
                if (ur.roles && ur.roles.is_active !== false) {
                    const canonical = SessionService.normalizeRoleName(ur.roles.role_name);
                    if (canonical && !roles.includes(canonical)) {
                        roles.push(canonical);
                    }
                }
            }
            if (roles.length === 0 && fallbackTokenRoles && Array.isArray(fallbackTokenRoles)) {
                for (const r of fallbackTokenRoles) {
                    const canonical = SessionService.normalizeRoleName(r);
                    if (canonical && !roles.includes(canonical)) {
                        roles.push(canonical);
                    }
                }
            }
            let hasEnrolledStudent = false;
            const parentStudentIds = [];
            if (parentRecord) {
                if (!roles.includes('PARENT')) {
                    roles.push('PARENT');
                }
                for (const sp of parentRecord.student_parents || []) {
                    if (sp.student_id) {
                        parentStudentIds.push(sp.student_id);
                    }
                    if (sp.students && sp.students.status === 'active') {
                        hasEnrolledStudent = true;
                    }
                }
                if (hasEnrolledStudent && !roles.includes('ENROLLED_PARENT')) {
                    roles.push('ENROLLED_PARENT');
                }
            }
            if (studentRecord && !roles.includes('STUDENT')) {
                roles.push('STUDENT');
            }
            if (roles.length === 0) {
                logger_1.logger.warn(`[SessionService] Fail-closed: User ${user.user_id} (${user.email}) has no valid active roles. Session rejected.`);
                return null;
            }
            const permissions = SessionService.derivePermissions(roles, hasEnrolledStudent);
            return {
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
                org_name: user.organizations_users_org_idToorganizations?.org_name,
                tenant_name: user.organizations_users_org_idToorganizations?.org_name,
                roles,
                permissions,
                login_status: 'APPROVED',
                hasEnrolledStudent,
                isPostAdmission: hasEnrolledStudent || roles.includes('ENROLLED_PARENT'),
                staff_id: staffRecord?.staff_id || undefined,
                student_id: studentRecord?.student_id || undefined,
                parent_id: parentRecord?.parent_id || undefined,
                parent_student_ids: parentStudentIds.length > 0 ? parentStudentIds : undefined,
            };
        }
        catch (err) {
            logger_1.logger.error('[SessionService] DB user session resolution failed', {
                userId,
                error: err?.message || String(err),
            });
            return null;
        }
    }
    async validateSession(token) {
        try {
            const decoded = auth_service_1.AuthService.verifyToken(token);
            if (!decoded || !decoded.userId)
                return null;
            return await this.validateUserById(decoded.userId, decoded.roles);
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
