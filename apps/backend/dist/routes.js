"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("./auth/auth.middleware");
const auth_routes_1 = require("./auth/auth.routes");
const auth_controller_1 = require("./auth/auth.controller");
const tenant_middleware_1 = require("./middlewares/tenant.middleware");
const rbac_middleware_1 = require("./rbac/rbac.middleware");
const permissions_1 = require("./rbac/permissions");
const supabase_1 = require("./config/supabase");
const crm_routes_1 = require("./modules/admission/crm.routes");
const application_routes_1 = require("./modules/admission/application.routes");
const document_routes_1 = require("./modules/admission/document.routes");
const evaluation_routes_1 = require("./modules/admission/evaluation.routes");
const assessment_routes_1 = require("./modules/admission/assessment.routes");
const enrollment_routes_1 = require("./modules/admission/enrollment.routes");
const admission_controller_1 = require("./modules/admission/admission.controller");
const index_1 = require("./modules/admission/index");
const dashboard_routes_1 = require("./modules/dashboard/dashboard.routes");
const import_routes_1 = require("./modules/import/import.routes");
const department_routes_1 = __importDefault(require("./modules/departments/department.routes"));
const admin_routes_1 = require("./modules/admin/admin.routes");
const bulk_routes_1 = require("./modules/admin/bulk.routes");
const workflow_routes_1 = require("./workflows/workflow.routes");
const task_routes_1 = require("./workflows/task.routes");
const lead_routes_1 = require("./modules/lead-management/routes/lead.routes");
const isUuidStr = (str) => !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
const admission_routes_1 = require("./modules/admission-management/routes/admission.routes");
const admission_controller_2 = require("./modules/admission-management/controllers/admission.controller");
const student_routes_1 = require("./modules/student-management/routes/student.routes");
const parent_routes_1 = require("./modules/parent-management/routes/parent.routes");
const academic_routes_1 = require("./modules/academic-management/routes/academic.routes");
const staff_routes_1 = require("./modules/staff-management/routes/staff.routes");
const user_routes_1 = require("./modules/user-management/routes/user.routes");
const chatbot_routes_1 = require("./modules/chatbot/routes/chatbot.routes");
const env_1 = require("./config/env");
exports.router = (0, express_1.Router)();
// ======================================
// PUBLIC SYSTEM PROBES
// ======================================
exports.router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
exports.router.get('/health/liveness', (req, res) => {
    res.json({ status: 'alive', service: 'edutrack-api', timestamp: new Date().toISOString() });
});
const prismaClient_1 = __importDefault(require("./lib/prismaClient"));
exports.router.get('/health/readiness', async (req, res) => {
    try {
        await prismaClient_1.default.organizations.findFirst({ select: { org_id: true } });
        res.json({
            status: 'ready',
            service: 'edutrack-api',
            database: 'connected',
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        res.status(503).json({
            status: 'unhealthy',
            service: 'edutrack-api',
            database: 'disconnected',
            error: 'Database connection check failed',
        });
    }
});
exports.router.get('/system/info', (req, res) => {
    res.json({ mode: env_1.env.SYSTEM_MODE });
});
// ======================================
// PUBLIC AUTHENTICATION ROUTER (Before Global Auth Middleware)
// Handles: /auth/login, /v1/auth/login, /auth/refresh, /v1/auth/refresh
// ======================================
exports.router.use('/auth', auth_routes_1.publicAuthRouter);
exports.router.use('/v1/auth', auth_routes_1.publicAuthRouter);
// Exposed Admission Route for registration & Guest Drafts (CRM pipeline)
exports.router.post('/v1/admission/register', tenant_middleware_1.resolveTenantMiddleware, auth_controller_1.AuthController.registerParent);
exports.router.post('/v1/admission/verify-otp', auth_controller_1.AuthController.verifyOtp);
exports.router.post('/v1/admission/public-apply', index_1.publicApplicationController.apply);
exports.router.post('/admissions/public-apply', index_1.publicApplicationController.apply);
exports.router.post('/admissions', auth_middleware_1.authenticateOptional, admission_controller_1.AdmissionController.create);
// Public Online Enquiry Endpoints (Website Visitors)
exports.router.get('/v1/admission/crm/query-types', index_1.enquiryController.getQueryTypes);
exports.router.get('/v1/admission/query-types', index_1.enquiryController.getQueryTypes);
exports.router.get('/admission/query-types', index_1.enquiryController.getQueryTypes);
exports.router.post('/v1/admission/crm/enquiries', tenant_middleware_1.resolveTenantMiddleware, auth_middleware_1.authenticateOptional, index_1.enquiryController.create);
exports.router.post('/v1/admission/enquiries', tenant_middleware_1.resolveTenantMiddleware, auth_middleware_1.authenticateOptional, index_1.enquiryController.create);
// AI Chatbot & Admission Assistant Module (Public/Optional Auth - Phase 3.8)
exports.router.use('/v1/chatbot', chatbot_routes_1.chatbotRouter);
exports.router.use('/chatbot', chatbot_routes_1.chatbotRouter);
// Public lookup for schools/organizations
exports.router.get('/schools', async (req, res) => {
    try {
        const orgs = await prismaClient_1.default.organizations.findMany({
            where: { status: 'active' },
            select: { org_id: true, org_name: true, org_code: true },
            take: 10,
        });
        res.json(orgs.map((o) => ({ id: o.org_id, name: o.org_name, code: o.org_code })));
    }
    catch (error) {
        res.status(200).json([]);
    }
});
// v1-prefixed alias so {{baseUrl}}/schools works with baseUrl=http://localhost:3000/api/v1
exports.router.get('/v1/schools', async (req, res) => {
    try {
        const orgs = await prismaClient_1.default.organizations.findMany({
            where: { status: 'active' },
            select: { org_id: true, org_name: true, org_code: true },
            take: 10,
        });
        res.json(orgs.map((o) => ({ id: o.org_id, name: o.org_name, code: o.org_code })));
    }
    catch (error) {
        res.status(200).json([]);
    }
});
// Public lookup for current year
exports.router.get('/public/academic-year', async (req, res) => {
    try {
        const year = await prismaClient_1.default.academic_years.findFirst({
            orderBy: { created_at: 'desc' },
            select: { academic_year_id: true, academic_year_name: true },
        });
        res.json(year ? { id: year.academic_year_id, year_label: year.academic_year_name } : null);
    }
    catch (error) {
        res.status(200).json(null);
    }
});
// v1-prefixed alias
exports.router.get('/v1/public/academic-year', async (req, res) => {
    try {
        const year = await prismaClient_1.default.academic_years.findFirst({
            orderBy: { created_at: 'desc' },
            select: { academic_year_id: true, academic_year_name: true },
        });
        res.json(year ? { id: year.academic_year_id, year_label: year.academic_year_name } : null);
    }
    catch (error) {
        res.status(200).json(null);
    }
});
const client_1 = require("@prisma/client");
// Public lookup for academic years of a school
exports.router.get('/public/academic-years', async (req, res) => {
    try {
        const targetOrgId = (req.query.school_id ||
            req.query.org_id ||
            req.context?.user?.org_id ||
            req.context?.user?.school_id);
        if (!targetOrgId) {
            return res
                .status(400)
                .json({ error: 'School ID (school_id or org_id) parameter is required' });
        }
        const years = await prismaClient_1.default.academic_years.findMany({
            where: { org_id: targetOrgId },
            orderBy: { created_at: 'desc' },
            select: { academic_year_id: true, academic_year_name: true, status: true },
        });
        res.json(years.map((y) => ({
            id: y.academic_year_id,
            year_label: y.academic_year_name,
            is_active: y.status === client_1.academic_year_status.admissions_open ||
                y.status === client_1.academic_year_status.open ||
                y.status === client_1.academic_year_status.planning,
        })));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// v1-prefixed alias
exports.router.get('/v1/public/academic-years', async (req, res) => {
    try {
        const targetOrgId = (req.query.school_id ||
            req.query.org_id ||
            req.context?.user?.org_id ||
            req.context?.user?.school_id);
        if (!targetOrgId) {
            return res
                .status(400)
                .json({ error: 'School ID (school_id or org_id) parameter is required' });
        }
        const years = await prismaClient_1.default.academic_years.findMany({
            where: { org_id: targetOrgId },
            orderBy: { created_at: 'desc' },
            select: { academic_year_id: true, academic_year_name: true, status: true },
        });
        res.json(years.map((y) => ({
            id: y.academic_year_id,
            year_label: y.academic_year_name,
            is_active: y.status === client_1.academic_year_status.admissions_open ||
                y.status === client_1.academic_year_status.open ||
                y.status === client_1.academic_year_status.planning,
        })));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.router.get('/public/classes', async (req, res) => {
    try {
        let targetOrgId = (req.query.school_id ||
            req.query.org_id ||
            req.context?.user?.org_id ||
            req.context?.user?.school_id);
        if (!targetOrgId || targetOrgId === 'school-main' || targetOrgId === 'org-main') {
            const activeOrg = (await prismaClient_1.default.organizations.findFirst({ where: { status: 'active' } })) ||
                (await prismaClient_1.default.organizations.findFirst());
            if (activeOrg)
                targetOrgId = activeOrg.org_id;
        }
        if (!targetOrgId) {
            return res
                .status(400)
                .json({ error: 'School ID (school_id or org_id) parameter is required' });
        }
        const { academic_year_id } = req.query;
        let targetYearId = isUuidStr(academic_year_id) ? academic_year_id : '';
        if (!targetYearId && targetOrgId && isUuidStr(targetOrgId)) {
            const activeYear = await prismaClient_1.default.academic_years.findFirst({
                where: { org_id: targetOrgId },
                orderBy: { created_at: 'desc' },
            });
            targetYearId = activeYear?.academic_year_id || '';
        }
        let aygList = [];
        if (targetYearId && isUuidStr(targetYearId)) {
            aygList = await prismaClient_1.default.academic_year_grades.findMany({
                where: {
                    academic_year_id: targetYearId,
                    is_active: true,
                },
                include: {
                    grades: true,
                },
                orderBy: {
                    grades: { display_order: 'asc' },
                },
            });
        }
        if (aygList.length === 0 && targetOrgId) {
            const grades = await prismaClient_1.default.grades.findMany({
                where: { org_id: targetOrgId, is_active: true },
                orderBy: { display_order: 'asc' },
            });
            const seenGrades = new Set();
            const uniqueGrades = [];
            for (const g of grades) {
                const key = `${g.grade_name}_${g.board || ''}`;
                if (!seenGrades.has(key)) {
                    seenGrades.add(key);
                    uniqueGrades.push(g);
                }
            }
            return res.json(uniqueGrades.map((g) => ({
                id: g.grade_id,
                academic_year_grade_id: g.grade_id,
                grade_id: g.grade_id,
                name: g.grade_name,
                grade_name: g.grade_name,
                board: g.board || 'CBSE',
                code: g.grade_code,
            })));
        }
        const seenAygKeys = new Set();
        const uniqueAygList = [];
        for (const ayg of aygList) {
            const gName = ayg.grades?.grade_name || ayg.grade_id;
            const key = `${gName}_${ayg.grades?.board || ''}`;
            if (!seenAygKeys.has(key)) {
                seenAygKeys.add(key);
                uniqueAygList.push(ayg);
            }
        }
        res.json(uniqueAygList.map((ayg) => ({
            id: ayg.academic_year_grade_id,
            academic_year_grade_id: ayg.academic_year_grade_id,
            grade_id: ayg.grade_id,
            name: ayg.grades.grade_name,
            grade_name: ayg.grades.grade_name,
            board: ayg.grades.board || 'CBSE',
            code: ayg.grades.grade_code,
            display_order: ayg.grades.display_order,
        })));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// v1-prefixed alias
exports.router.get('/v1/public/classes', async (req, res) => {
    try {
        let targetOrgId = (req.query.school_id ||
            req.query.org_id ||
            req.context?.user?.org_id ||
            req.context?.user?.school_id);
        if (!targetOrgId || targetOrgId === 'school-main' || targetOrgId === 'org-main') {
            const activeOrg = (await prismaClient_1.default.organizations.findFirst({ where: { status: 'active' } })) ||
                (await prismaClient_1.default.organizations.findFirst());
            if (activeOrg)
                targetOrgId = activeOrg.org_id;
        }
        if (!targetOrgId) {
            return res
                .status(400)
                .json({ error: 'School ID (school_id or org_id) parameter is required' });
        }
        const { academic_year_id } = req.query;
        let targetYearId = isUuidStr(academic_year_id) ? academic_year_id : '';
        if (!targetYearId && targetOrgId && isUuidStr(targetOrgId)) {
            const activeYear = await prismaClient_1.default.academic_years.findFirst({
                where: { org_id: targetOrgId },
                orderBy: { created_at: 'desc' },
            });
            targetYearId = activeYear?.academic_year_id || '';
        }
        let aygList = [];
        if (targetYearId && isUuidStr(targetYearId)) {
            aygList = await prismaClient_1.default.academic_year_grades.findMany({
                where: { academic_year_id: targetYearId, is_active: true },
                include: { grades: true },
                orderBy: { grades: { display_order: 'asc' } },
            });
        }
        if (aygList.length === 0 && targetOrgId) {
            const grades = await prismaClient_1.default.grades.findMany({
                where: { org_id: targetOrgId, is_active: true },
                orderBy: { display_order: 'asc' },
            });
            const seenGrades = new Set();
            const uniqueGrades = [];
            for (const g of grades) {
                const key = `${g.grade_name}_${g.board || ''}`;
                if (!seenGrades.has(key)) {
                    seenGrades.add(key);
                    uniqueGrades.push(g);
                }
            }
            return res.json(uniqueGrades.map((g) => ({
                id: g.grade_id,
                academic_year_grade_id: g.grade_id,
                grade_id: g.grade_id,
                name: g.grade_name,
                grade_name: g.grade_name,
                board: g.board || 'CBSE',
                code: g.grade_code,
            })));
        }
        const seenAygKeys = new Set();
        const uniqueAygList = [];
        for (const ayg of aygList) {
            const gName = ayg.grades?.grade_name || ayg.grade_id;
            const key = `${gName}_${ayg.grades?.board || ''}`;
            if (!seenAygKeys.has(key)) {
                seenAygKeys.add(key);
                uniqueAygList.push(ayg);
            }
        }
        res.json(uniqueAygList.map((ayg) => ({
            id: ayg.academic_year_grade_id,
            academic_year_grade_id: ayg.academic_year_grade_id,
            grade_id: ayg.grade_id,
            name: ayg.grades.grade_name,
            grade_name: ayg.grades.grade_name,
            board: ayg.grades.board || 'CBSE',
            code: ayg.grades.grade_code,
            display_order: ayg.grades.display_order,
        })));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Public lookup for transport routes of a school
exports.router.get('/public/transport-routes', async (req, res) => {
    res.json([]);
});
// Public lookup for fee structures of a school
exports.router.get('/public/fee-structures', async (req, res) => {
    res.json([]);
});
// Public lookup for admission grades (mapping layer)
exports.router.get('/public/admission/grades', async (req, res) => {
    try {
        const { school_id, academic_year_id } = req.query;
        let targetOrgId = school_id;
        if (!targetOrgId) {
            const activeOrg = await prismaClient_1.default.organizations.findFirst({ where: { status: 'active' } });
            targetOrgId = activeOrg?.org_id || '';
        }
        let targetYearId = academic_year_id;
        if (!targetYearId && targetOrgId) {
            const activeYear = await prismaClient_1.default.academic_years.findFirst({
                where: { org_id: targetOrgId },
                orderBy: { created_at: 'desc' },
            });
            targetYearId = activeYear?.academic_year_id || '';
        }
        let aygList = [];
        if (targetYearId) {
            aygList = await prismaClient_1.default.academic_year_grades.findMany({
                where: { academic_year_id: targetYearId, is_active: true },
                include: { grades: true },
                orderBy: { grades: { display_order: 'asc' } },
            });
        }
        if (aygList.length === 0 && targetOrgId) {
            const grades = await prismaClient_1.default.grades.findMany({
                where: { org_id: targetOrgId, is_active: true },
                orderBy: { display_order: 'asc' },
            });
            return res.json(grades.map((g) => ({
                id: g.grade_id,
                grade_id: g.grade_id,
                grade_name: g.grade_name,
                board: g.board || 'CBSE',
            })));
        }
        res.json(aygList.map((ayg) => ({
            id: ayg.academic_year_grade_id,
            academic_year_grade_id: ayg.academic_year_grade_id,
            grade_id: ayg.grade_id,
            grade_name: ayg.grades.grade_name,
            board: ayg.grades.board || 'CBSE',
        })));
    }
    catch (error) {
        res.status(200).json([]);
    }
});
// Shared Prisma-backed handler for the admission config public lookup.
// Both /public/admission/config and /v1/public/admission/config delegate here
// so there is exactly ONE implementation — no dual-implementation risk.
const admissionConfigHandler = async (req, res) => {
    try {
        const rawSchoolId = (req.query.school_id || req.query.org_id);
        const cleanSchoolId = typeof rawSchoolId === 'string' &&
            rawSchoolId.trim() !== '' &&
            rawSchoolId !== 'undefined' &&
            rawSchoolId !== 'null'
            ? rawSchoolId.trim()
            : '';
        const targetOrgId = cleanSchoolId ||
            (req.context?.user?.org_id || req.context?.user?.school_id) ||
            '';
        const schools = await prismaClient_1.default.organizations.findMany({
            where: { status: 'active' },
            select: { org_id: true, org_name: true, org_code: true },
            orderBy: { org_name: 'asc' },
        });
        let activeYear = null;
        if (targetOrgId) {
            const yr = await prismaClient_1.default.academic_years.findFirst({
                where: { org_id: targetOrgId },
                orderBy: { created_at: 'desc' },
                select: { academic_year_id: true, academic_year_name: true },
            });
            if (yr)
                activeYear = { id: yr.academic_year_id, year_label: yr.academic_year_name };
        }
        const grades = targetOrgId
            ? await prismaClient_1.default.grades.findMany({
                where: { org_id: targetOrgId, is_active: true },
                orderBy: { display_order: 'asc' },
                select: {
                    grade_id: true,
                    grade_name: true,
                    academic_year_grades: {
                        where: activeYear
                            ? { academic_year_id: activeYear.id, is_active: true }
                            : { is_active: true },
                        select: { academic_year_grade_id: true, academic_year_id: true },
                    },
                },
            })
            : [];
        res.json({
            version: new Date().toISOString(),
            schools: schools.map((s) => ({ id: s.org_id, name: s.org_name, code: s.org_code })),
            school: targetOrgId ? schools.find((s) => s.org_id === targetOrgId) || null : null,
            academicYear: activeYear,
            grades: grades.map((g) => ({
                id: g.grade_id,
                grade_name: g.grade_name,
                academic_year_grade_id: g.academic_year_grades?.[0]?.academic_year_grade_id || null,
            })),
            requiredDocuments: [
                { type: 'birth_certificate', label: 'Birth Certificate', required: true },
                { type: 'transfer_certificate', label: 'Transfer Certificate', required: false },
                { type: 'previous_marksheet', label: 'Previous Academic Report Card', required: false },
                { type: 'parent_id', label: 'Parent ID Proof (Aadhaar/Passport)', required: true },
                { type: 'photo', label: 'Student Passport Photo', required: true },
            ],
            admissionCalendar: { opens: '2026-10-01', closes: '2026-12-15', classStarts: '2026-08-15' },
        });
    }
    catch (error) {
        console.error('[admissionConfigHandler] Error:', error?.message || error);
        res.status(503).json({
            error: 'Admission configuration is temporarily unavailable. Please try again.',
            code: 'SERVICE_UNAVAILABLE',
        });
    }
};
// Consolidated public configuration for admissions (versioned metadata)
// Uses the shared Prisma-backed handler — SAME implementation as /v1/public/admission/config
exports.router.get('/public/admission/config', admissionConfigHandler);
// v1-prefixed alias — delegates to the SAME shared handler (zero implementation drift)
exports.router.get('/v1/public/admission/config', admissionConfigHandler);
// Temporary RBAC debug endpoint
exports.router.get('/public/inspect-rbac', async (req, res) => {
    try {
        const { data: users } = await supabase_1.supabase
            .from('users')
            .select('*')
            .eq('email', 'examplatform@edu.in');
        let userRoles = [];
        let permissions = [];
        if (users && users.length > 0) {
            const { data: ur } = await supabase_1.supabase
                .from('user_roles')
                .select('*, roles(*)')
                .eq('user_id', users[0].id);
            userRoles = ur || [];
            const { data: rp } = await supabase_1.supabase
                .from('role_permissions')
                .select('*, roles(*), permissions(*)')
                .in('role_id', userRoles.map((u) => u.role_id));
            permissions = rp || [];
        }
        const { data: allRoles } = await supabase_1.supabase.from('roles').select('*');
        const { data: allPerms } = await supabase_1.supabase.from('permissions').select('*');
        res.json({
            user: users?.[0] || null,
            userRoles,
            permissions: permissions.map((p) => ({
                role: p.roles?.name,
                permissionCode: p.permissions?.code,
                permissionName: p.permissions?.name,
            })),
            allRoles,
            allPermsCount: allPerms?.length || 0,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ======================================
// PROTECTED (Global Guard)
// ======================================
exports.router.use(auth_middleware_1.authenticate);
exports.router.use(auth_middleware_1.checkLoginApproval);
// Protected Auth Router
exports.router.use('/auth', auth_routes_1.protectedAuthRouter);
exports.router.use('/v1/auth', auth_routes_1.protectedAuthRouter);
// Parent CRM applications (alias for /v1/applications/mine)
exports.router.get('/v1/admission/my', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_VIEW_SELF), admission_controller_2.AdmissionController.getMine);
exports.router.post('/v1/admission/apply', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_CREATE), admission_controller_2.AdmissionController.create);
// 1. GET /me & GET /auth/me
const handleMe = async (req, res) => {
    try {
        const userObj = req.context.user;
        let entranceExamEnabled = false;
        if (userObj.roles.includes('PARENT')) {
            const { data: apps } = await supabase_1.supabase
                .from('admission_applications')
                .select('id')
                .eq('created_by', userObj.id)
                .is('deleted_at', null);
            const appIds = apps?.map((a) => a.id) || [];
            if (appIds.length > 0) {
                const { data: candidates } = await supabase_1.supabase
                    .from('admission_exam_session_candidates')
                    .select('id')
                    .in('application_id', appIds);
                const candidateIds = candidates?.map((c) => c.id) || [];
                if (candidateIds.length > 0) {
                    const { data: activeSessions } = await supabase_1.supabase
                        .from('admission_assessment_sessions')
                        .select('id')
                        .in('candidate_allocation_id', candidateIds)
                        .in('status', ['CREATED', 'ACTIVE']);
                    if (activeSessions && activeSessions.length > 0) {
                        entranceExamEnabled = true;
                    }
                }
            }
        }
        const enabledFeatures = {
            dashboard: true,
            finance: userObj.roles.some((r) => ['ADMIN', 'FINANCE_OFFICER'].includes(r)),
            entrance_exam: userObj.roles.some((r) => ['ADMIN', 'EXAM_CELL', 'EXAM_CELL_ADMIN'].includes(r)) ||
                entranceExamEnabled,
            hostel: false,
        };
        res.json({
            user: {
                ...userObj,
                enabledFeatures,
            },
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.router.get('/me', handleMe);
exports.router.get('/auth/me', handleMe);
exports.router.get('/v1/auth/me', handleMe);
// 2. GET /schools/current
exports.router.get('/schools/current', async (req, res) => {
    const school_id = req.context.user.school_id;
    if (!school_id)
        return res.status(404).json({ error: 'User not assigned to a school' });
    const { data, error } = await supabase_1.supabase.from('schools').select('*').eq('id', school_id).single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
// 3. GET /academic-years/current
exports.router.get('/academic-years/current', async (req, res) => {
    const school_id = req.context.user.school_id;
    const { data, error } = await supabase_1.supabase
        .from('academic_years')
        .select('*')
        .eq('school_id', school_id)
        .eq('is_active', true)
        .maybeSingle();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data); // Returns null if not found
});
// 3b. GET /academic-years (All)
exports.router.get('/academic-years', async (req, res) => {
    const school_id = req.context.user.school_id;
    const { data, error } = await supabase_1.supabase
        .from('academic_years')
        .select('*')
        .eq('school_id', school_id)
        .order('year_label', { ascending: false });
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
// 4. POST /academic-years
exports.router.post('/academic-years', async (req, res) => {
    const school_id = req.context.user.school_id;
    const { year_label, is_active } = req.body;
    if (!year_label)
        return res.status(400).json({ error: 'Year label is required' });
    // If making this active, deactivate others
    if (is_active) {
        await supabase_1.supabase.from('academic_years').update({ is_active: false }).eq('school_id', school_id);
    }
    const { data, error } = await supabase_1.supabase
        .from('academic_years')
        .insert({ school_id, year_label, is_active: is_active || false })
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});
// ======================================
// MODULE ROUTES
// ======================================
exports.router.use('/v1/admission/crm', crm_routes_1.crmRouter);
exports.router.use('/v1/admission/application/documents', document_routes_1.documentRouter);
exports.router.use('/v1/admission/evaluation', evaluation_routes_1.evaluationRouter);
exports.router.use('/v1/admission/assessment', assessment_routes_1.assessmentRouter);
exports.router.use('/v1/admission/enrollment', enrollment_routes_1.enrollmentRouter);
exports.router.use('/v1/admission/application', application_routes_1.applicationRouter);
exports.router.use('/dashboard', dashboard_routes_1.dashboardRouter);
exports.router.use('/import', import_routes_1.importRouter);
exports.router.use('/v1/workflows', workflow_routes_1.workflowRouter);
exports.router.use('/v1/tasks', task_routes_1.taskRouter);
// System RBAC Audit Endpoint
exports.router.get('/system/rbac/audit', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMIN_DASHBOARD_VIEW), async (req, res) => {
    try {
        console.log('[Audit] Running RBAC System Integrity Scan...');
        // 1. Fetch Master Lists
        const { data: dbRoles, error: rolesErr } = await supabase_1.supabase
            .from('roles')
            .select('id, name, description');
        const { data: dbPerms, error: permsErr } = await supabase_1.supabase
            .from('permissions')
            .select('id, code, description');
        const { data: dbUserRoles, error: urErr } = await supabase_1.supabase
            .from('user_roles')
            .select('user_id, role_id');
        const { data: dbRolePerms, error: rpErr } = await supabase_1.supabase
            .from('role_permissions')
            .select('role_id, permission_id');
        const { data: dbUsers, error: usersErr } = await supabase_1.supabase
            .from('users')
            .select('id, email, status, login_status');
        if (rolesErr || permsErr || urErr || rpErr || usersErr) {
            throw new Error(`Data fetch failed: ${rolesErr?.message || permsErr?.message || urErr?.message || rpErr?.message || usersErr?.message}`);
        }
        // 2. Perform Checks
        const registeredPermsInCode = Object.values(permissions_1.PERMISSIONS);
        const dbPermCodes = dbPerms.map((p) => p.code);
        // Dangling Permissions (DB but not in code definitions, and vice versa)
        const missingInDb = registeredPermsInCode.filter((p) => !dbPermCodes.includes(p));
        const unregisteredInCode = dbPermCodes.filter((p) => !registeredPermsInCode.includes(p));
        // Duplicate Mappings check in role_permissions
        const pairingCounts = new Map();
        const duplicateMappings = [];
        dbRolePerms.forEach((rp) => {
            const key = `${rp.role_id}:${rp.permission_id}`;
            const count = pairingCounts.get(key) || 0;
            pairingCounts.set(key, count + 1);
            if (count > 0) {
                duplicateMappings.push({ role_id: rp.role_id, permission_id: rp.permission_id });
            }
        });
        // Statistics
        const activeUsers = dbUsers.filter((u) => u.status === 'active');
        const pendingApprovals = dbUsers.filter((u) => u.login_status === 'PENDING');
        res.json({
            timestamp: new Date().toISOString(),
            status: 'SECURE',
            summary: {
                total_roles: dbRoles.length,
                total_permissions: dbPerms.length,
                total_role_permission_mappings: dbRolePerms.length,
                total_users: dbUsers.length,
                active_users: activeUsers.length,
                pending_login_approvals: pendingApprovals.length,
            },
            dangling_permissions: {
                defined_in_code_but_missing_in_db: missingInDb,
                defined_in_db_but_missing_in_code: unregisteredInCode,
            },
            integrity: {
                duplicate_role_permission_mappings: duplicateMappings.length,
                duplicate_mappings_details: duplicateMappings,
                unassigned_roles: dbRoles
                    .filter((r) => !dbUserRoles.some((ur) => ur.role_id === r.id))
                    .map((r) => r.name),
            },
            roles_list: dbRoles.map((r) => ({
                id: r.id,
                name: r.name,
                mapped_permissions_count: dbRolePerms.filter((rp) => rp.role_id === r.id).length,
            })),
        });
    }
    catch (err) {
        console.error('[RBAC Audit Error]:', err);
        res.status(500).json({ error: 'RBAC Audit Failed', message: err.message });
    }
});
// Guard all admin routes under admin.dashboard.view
exports.router.use('/admin', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMIN_DASHBOARD_VIEW));
exports.router.use('/admin', admin_routes_1.adminRouter);
exports.router.use('/admin/bulk', bulk_routes_1.bulkRouter);
exports.router.use('/admin/departments', department_routes_1.default);
// Lead Management Module (Phase 3.1)
exports.router.use('/v1/leads', auth_middleware_1.authenticate, lead_routes_1.leadRouter);
exports.router.use('/leads', auth_middleware_1.authenticate, lead_routes_1.leadRouter);
// Admission Application Management Module (Phase 3.2)
exports.router.use('/v1/applications', auth_middleware_1.authenticate, admission_routes_1.admissionRouter);
exports.router.use('/applications', auth_middleware_1.authenticate, admission_routes_1.admissionRouter);
// Student Management Module (Phase 3.3)
exports.router.use('/v1/students', auth_middleware_1.authenticate, student_routes_1.studentRouter);
exports.router.use('/students', auth_middleware_1.authenticate, student_routes_1.studentRouter);
// Parent Management Module (Phase 3.4)
exports.router.use('/v1/parents', auth_middleware_1.authenticate, parent_routes_1.parentRouter);
exports.router.use('/parents', auth_middleware_1.authenticate, parent_routes_1.parentRouter);
// Academic Structure Management Module (Phase 3.5)
exports.router.use('/v1/academic', auth_middleware_1.authenticate, academic_routes_1.academicRouter);
exports.router.use('/academic', auth_middleware_1.authenticate, academic_routes_1.academicRouter);
// Staff Management Module (Phase 3.6)
exports.router.use('/v1/staff', auth_middleware_1.authenticate, staff_routes_1.staffRouter);
exports.router.use('/staff', auth_middleware_1.authenticate, staff_routes_1.staffRouter);
// User & Role Administration Module (Phase 3.7)
exports.router.use('/v1/users', auth_middleware_1.authenticate, user_routes_1.userRouter);
exports.router.use('/users', auth_middleware_1.authenticate, user_routes_1.userRouter);
