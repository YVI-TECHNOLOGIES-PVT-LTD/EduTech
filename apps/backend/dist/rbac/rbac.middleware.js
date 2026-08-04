"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requirePermission = exports.checkRole = exports.checkPermission = exports.getEffectiveRoles = void 0;
const ROLE_ALIASES = {
    'HEAD_OF_INSTITUTE': ['HOI', 'HEAD_OF_INSTITUTE', 'PRINCIPAL'],
    'HOI': ['HOI', 'HEAD_OF_INSTITUTE', 'PRINCIPAL'],
    'PRINCIPAL': ['HOI', 'HEAD_OF_INSTITUTE', 'PRINCIPAL'],
    'COUNSELLOR': ['COUNSELOR', 'COUNSELLOR'],
    'COUNSELOR': ['COUNSELOR', 'COUNSELLOR'],
    'ACCOUNTANT': ['FINANCE_OFFICER', 'ACCOUNTANT'],
    'FINANCE_OFFICER': ['FINANCE_OFFICER', 'ACCOUNTANT'],
    'DRIVER': ['BUS_DRIVER', 'DRIVER'],
    'BUS_DRIVER': ['BUS_DRIVER', 'DRIVER'],
    'EXAM_CELL': ['EXAM_CELL', 'EXAM_CELL_ADMIN'],
    'EXAM_CELL_ADMIN': ['EXAM_CELL', 'EXAM_CELL_ADMIN'],
};
const getEffectiveRoles = (roles) => {
    const effective = new Set();
    for (const role of roles) {
        effective.add(role);
        const aliases = ROLE_ALIASES[role];
        if (aliases) {
            aliases.forEach(alias => effective.add(alias));
        }
    }
    return Array.from(effective);
};
exports.getEffectiveRoles = getEffectiveRoles;
/** Read-only Applicant360 enrichment GETs — allowed when user can view the application. */
const APPLICANT360_READ_GET_PERMISSIONS = new Set([
    'admission.exam.evaluate',
    'admission.confirm.enroll',
    'admission.fees.initialize',
    'admission.merit.generate',
    'admission.document.view',
    'admission.document.checklist',
]);
function canViewAdmissionApplication(permissions, roles) {
    if (roles.includes('COUNSELOR'))
        return true;
    if (roles.includes('ACCOUNTANT'))
        return true;
    if (permissions.includes('admission.application.view'))
        return true;
    if (permissions.includes('admission.view_own'))
        return true;
    if (permissions.includes('admission.review') || permissions.includes('admission.view_all'))
        return true;
    return false;
}
/**
 * Middleware to enforce RBAC permissions using cached context.
 */
const checkPermission = (requiredPermission) => {
    return (req, res, next) => {
        // 1. Ensure Auth Middleware ran
        if (!req.context?.user) {
            return res.status(401).json({ error: 'Unauthorized: No session context' });
        }
        const permissions = req.context.user.permissions;
        const roles = (0, exports.getEffectiveRoles)(req.context.user.roles);
        console.log(`[RBAC] User: ${req.context.user.email}, Required: ${requiredPermission}, Has: ${permissions.length} perms`);
        // 2. Super Admin Bypass
        if (roles.includes('SUPERADMIN')) {
            return next();
        }
        // 2b. Admission Officer Bypass for all admission module actions
        if (roles.includes('ADMISSION_OFFICER') && requiredPermission.startsWith('admission.')) {
            return next();
        }
        // 2c. Accountant Bypass for fee setup and payment collections
        if (roles.includes('ACCOUNTANT') &&
            (requiredPermission === 'admission.fees.initialize' ||
                requiredPermission === 'fees.demand.generate' ||
                requiredPermission === 'fees.payment.collect' ||
                requiredPermission === 'fees.receipt.generate' ||
                requiredPermission === 'fees.structure.manage' ||
                requiredPermission === 'fees.waiver.approve' ||
                requiredPermission === 'fees.view')) {
            return next();
        }
        // 2d. HOI Bypass for offer approval and final enrollment confirmations
        if (roles.includes('HOI') &&
            (requiredPermission === 'admission.approve' ||
                requiredPermission === 'admission.reject' ||
                requiredPermission === 'admission.confirm.enroll')) {
            return next();
        }
        // 2e. Parent / Applicant Bypass for own application lifecycle actions
        if (roles.includes('PARENT') &&
            (requiredPermission === 'admission.view_own' ||
                requiredPermission === 'admission.create' ||
                requiredPermission === 'admission.update' ||
                requiredPermission === 'admission.application.view' ||
                requiredPermission === 'admission.application.update' ||
                requiredPermission === 'admission.application.submit' ||
                requiredPermission === 'admission.document.upload' ||
                requiredPermission === 'admission.document.download' ||
                requiredPermission === 'admission.document.view' ||
                requiredPermission === 'admission.document.delete' ||
                requiredPermission === 'admission.document.checklist' ||
                requiredPermission === 'admission.fees.view' ||
                requiredPermission === 'admission.enrollment.view')) {
            return next();
        }
        // 2f. View Own / View All hierarchy fallback
        if (requiredPermission === 'admission.view_own' &&
            (permissions.includes('admission.view_all') || permissions.includes('admission.review'))) {
            return next();
        }
        // 2g. Admission Desk Bypass for viewing classes (needed for enrollment section provisioning)
        if (requiredPermission === 'CLASS_VIEW' &&
            (permissions.includes('admission.enquiry.view') ||
                permissions.includes('admission.review') ||
                permissions.includes('admission.view_all') ||
                roles.includes('ADMISSION_OFFICER') ||
                roles.includes('RECEPTIONIST') ||
                roles.includes('COUNSELOR'))) {
            return next();
        }
        // 2h. Receptionist Bypass for counselor assignment
        if (requiredPermission === 'admission.leads.manage' &&
            req.originalUrl.endsWith('/assign') &&
            (permissions.includes('admission.visitors.manage') || roles.includes('RECEPTIONIST'))) {
            return next();
        }
        // 2i. Receptionist Bypass for enquiry conversion (creates lead + application)
        if (requiredPermission === 'admission.leads.manage' &&
            req.originalUrl.endsWith('/convert') &&
            (permissions.includes('admission.enquiry.create') || roles.includes('RECEPTIONIST'))) {
            return next();
        }
        // 2j. Counselor bypass for viewing CRM applications and uploading documents
        if ((requiredPermission === 'admission.application.view' ||
            requiredPermission === 'admission.document.view' ||
            requiredPermission === 'admission.document.upload') &&
            roles.includes('COUNSELOR')) {
            return next();
        }
        // 2l. Accountant Bypass for listing and viewing applications (needed for payments collection dashboard)
        if ((requiredPermission === 'admission.view_all' ||
            requiredPermission === 'admission.application.view') &&
            roles.includes('ACCOUNTANT')) {
            return next();
        }
        // 2m. Exam Cell Bypass for listing and viewing applications (needed for exam evaluation dashboard)
        if ((requiredPermission === 'admission.view_all' ||
            requiredPermission === 'admission.application.view') &&
            roles.includes('EXAM_CELL')) {
            return next();
        }
        // 2n. Exam Cell Bypass for merit generation and offer management (Merit Desk & Offer Letters pages)
        if ((requiredPermission === 'admission.merit.generate' ||
            requiredPermission === 'admission.offer.manage') &&
            roles.includes('EXAM_CELL')) {
            return next();
        }
        // 2o. Exam Cell Bypass for general exams, marks entry, and student lists
        if ((requiredPermission === 'EXAM_VIEW' ||
            requiredPermission === 'EXAM_CREATE' ||
            requiredPermission === 'MARKS_ENTER' ||
            requiredPermission === 'MARKS_VIEW' ||
            requiredPermission === 'SUBJECT_VIEW' ||
            requiredPermission === 'student.view' ||
            requiredPermission === 'student.read' ||
            requiredPermission === 'STUDENT_VIEW') &&
            roles.includes('EXAM_CELL')) {
            return next();
        }
        // 2k. Applicant360 read enrichment — GET only, mirrors admission.application.view access
        if (req.method === 'GET' &&
            APPLICANT360_READ_GET_PERMISSIONS.has(requiredPermission) &&
            canViewAdmissionApplication(permissions, roles)) {
            return next();
        }
        // 3. Check Permission
        // 4. Check Role
        if (permissions.includes(requiredPermission)) {
            return next();
        }
        if (!permissions.includes(requiredPermission)) {
            console.error(`[RBAC] Denied. User ${req.context.user.email} (Roles: ${req.context.user.roles}) needs ${requiredPermission}. Has: ${permissions}`);
            return res.status(403).json({
                error: 'Forbidden: Insufficient Permissions',
                required: requiredPermission,
                has: permissions,
                user: req.context.user.email,
                roles: req.context.user.roles
            });
        }
    };
};
exports.checkPermission = checkPermission;
/**
 * Middleware to enforce Role-based access.
 * Returns 403 if user does not have ANY of the required roles.
 */
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.context?.user) {
            return res.status(401).json({ error: 'Unauthorized: No session context' });
        }
        const userRoles = (0, exports.getEffectiveRoles)(req.context.user.roles);
        const hasRole = userRoles.some(r => allowedRoles.includes(r));
        if (hasRole || userRoles.includes('SUPERADMIN')) {
            return next();
        }
        console.error(`[RBAC] Role Denied. Required: ${allowedRoles}. User has: ${userRoles}`);
        return res.status(403).json({
            error: 'Forbidden: Insufficient Permissions',
            required_roles: allowedRoles,
            user_roles: userRoles
        });
    };
};
exports.checkRole = checkRole;
// Alias for compatibility if needed (user prompt called it "checkPermission", previous file was "requirePermission")
exports.requirePermission = exports.checkPermission;
exports.requireRole = exports.checkRole;
