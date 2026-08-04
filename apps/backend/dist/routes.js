"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("./auth/auth.middleware");
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
const env_1 = require("./config/env");
exports.router = (0, express_1.Router)();
// ======================================
// PUBLIC
// ======================================
exports.router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
exports.router.get('/health/liveness', (req, res) => {
    res.json({ status: 'alive', service: 'edutrack-api', timestamp: new Date().toISOString() });
});
exports.router.get('/health/readiness', async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase.from('schools').select('id').limit(1);
        if (error)
            throw error;
        res.json({ status: 'ready', service: 'edutrack-api', database: 'connected', timestamp: new Date().toISOString() });
    }
    catch (err) {
        res.status(503).json({ status: 'unhealthy', service: 'edutrack-api', database: 'disconnected', error: err.message });
    }
});
exports.router.get('/system/info', (req, res) => {
    res.json({ mode: env_1.env.SYSTEM_MODE });
});
// Exposed Admission Route for registration & Guest Drafts (CRM pipeline)
exports.router.post('/v1/admission/public-apply', index_1.publicApplicationController.apply);
exports.router.post('/admissions/public-apply', index_1.publicApplicationController.apply);
exports.router.post('/admissions', auth_middleware_1.authenticateOptional, admission_controller_1.AdmissionController.create);
// Public lookup for schools
// Public lookup for schools
exports.router.get('/schools', async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase.from('schools').select('id, name, code').limit(10);
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        res.status(200).json([]); // Suppress error for public view
    }
});
// Public lookup for current year (required for registration if not hardcoded)
// Public lookup for current year (required for registration if not hardcoded)
exports.router.get('/public/academic-year', async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('academic_years')
            .select('id, year_label')
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
        if (error)
            throw error;
        res.json(data); // Returns null if not found, with 200 OK
    }
    catch (error) {
        res.status(200).json(null);
    }
});
// Public lookup for academic years of a school
exports.router.get('/public/academic-years', async (req, res) => {
    try {
        const { school_id } = req.query;
        if (!school_id)
            return res.status(400).json({ error: 'school_id is required' });
        const { data, error } = await supabase_1.supabase
            .from('academic_years')
            .select('id, year_label, is_active')
            .eq('school_id', school_id)
            .order('year_label', { ascending: false });
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        res.status(200).json([]);
    }
});
// Public lookup for classes/grades of a school
exports.router.get('/public/classes', async (req, res) => {
    try {
        const { school_id } = req.query;
        if (!school_id)
            return res.status(400).json({ error: 'school_id is required' });
        const { data, error } = await supabase_1.supabase
            .from('classes')
            .select('id, name')
            .eq('school_id', school_id)
            .order('name');
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        res.status(200).json([]);
    }
});
// Public lookup for transport routes of a school
exports.router.get('/public/transport-routes', async (req, res) => {
    try {
        const { school_id } = req.query;
        if (!school_id)
            return res.status(400).json({ error: 'school_id is required' });
        const { data, error } = await supabase_1.supabase
            .from('transport_routes')
            .select('id, name')
            .eq('school_id', school_id)
            .order('name');
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        res.status(200).json([]);
    }
});
// Public lookup for fee structures of a school
exports.router.get('/public/fee-structures', async (req, res) => {
    try {
        const { school_id } = req.query;
        if (!school_id)
            return res.status(400).json({ error: 'school_id is required' });
        const { data, error } = await supabase_1.supabase
            .from('fee_structures')
            .select('id, name, amount')
            .eq('school_id', school_id)
            .order('name');
        if (error)
            throw error;
        res.json(data || []);
    }
    catch (error) {
        res.status(200).json([]);
    }
});
// Public lookup for admission grades (mapping layer)
exports.router.get('/public/admission/grades', async (req, res) => {
    try {
        const { school_id } = req.query;
        if (!school_id)
            return res.status(400).json({ error: 'school_id is required' });
        const { data, error } = await supabase_1.supabase
            .from('classes')
            .select('id, name')
            .eq('school_id', school_id)
            .order('name');
        if (error)
            throw error;
        // Return mapped list of grades/classes (just id and grade_name)
        res.json(data?.map(c => ({ id: c.id, grade_name: c.name })) || []);
    }
    catch (error) {
        res.status(200).json([]);
    }
});
// Consolidated public configuration for admissions (versioned metadata)
exports.router.get('/public/admission/config', async (req, res) => {
    try {
        const { school_id } = req.query;
        // Fetch all schools for selector
        const { data: schools, error: schoolsError } = await supabase_1.supabase
            .from('schools')
            .select('id, name, code');
        if (schoolsError)
            throw schoolsError;
        let activeSchool = null;
        let activeYear = null;
        let gradesList = [];
        if (school_id) {
            // Fetch selected school details
            const { data: school, error: schoolError } = await supabase_1.supabase
                .from('schools')
                .select('id, name, code')
                .eq('id', school_id)
                .maybeSingle();
            if (schoolError)
                throw schoolError;
            activeSchool = school;
            // Fetch active academic year
            const { data: year, error: yearError } = await supabase_1.supabase
                .from('academic_years')
                .select('id, year_label, is_active')
                .eq('school_id', school_id)
                .eq('is_active', true)
                .maybeSingle();
            if (yearError)
                throw yearError;
            activeYear = year;
            // Fetch grades (classes mapped cleanly to grades)
            const { data: classes, error: classesError } = await supabase_1.supabase
                .from('classes')
                .select('id, name')
                .eq('school_id', school_id)
                .order('name');
            if (classesError)
                throw classesError;
            gradesList = classes?.map(c => ({ id: c.id, grade_name: c.name })) || [];
        }
        // Dynamically compute the version based on max updated_at of the configurations
        const { data: schoolMax } = await supabase_1.supabase.from('schools').select('updated_at').order('updated_at', { ascending: false }).limit(1).maybeSingle();
        const { data: yearMax } = await supabase_1.supabase.from('academic_years').select('updated_at').order('updated_at', { ascending: false }).limit(1).maybeSingle();
        const { data: classMax } = await supabase_1.supabase.from('classes').select('updated_at').order('updated_at', { ascending: false }).limit(1).maybeSingle();
        const times = [
            schoolMax?.updated_at ? new Date(schoolMax.updated_at).getTime() : 0,
            yearMax?.updated_at ? new Date(yearMax.updated_at).getTime() : 0,
            classMax?.updated_at ? new Date(classMax.updated_at).getTime() : 0
        ];
        const version = new Date(Math.max(...times, Date.now() - 3600000)).toISOString();
        res.json({
            version,
            schools: schools || [],
            school: activeSchool,
            academicYear: activeYear,
            grades: gradesList,
            requiredDocuments: [
                { type: 'birth_certificate', label: 'Birth Certificate', required: true },
                { type: 'transfer_certificate', label: 'Transfer Certificate', required: false },
                { type: 'previous_marksheet', label: 'Previous Academic Report Card', required: false },
                { type: 'parent_id', label: 'Parent ID Proof (Aadhaar/Passport)', required: true },
                { type: 'photo', label: 'Student Passport Photo', required: true }
            ],
            admissionCalendar: {
                opens: '2026-10-01',
                closes: '2026-12-15',
                classStarts: '2026-08-15'
            },
            brochure: {
                url: '/brochure.pdf',
                title: 'Greenwood High Admission Brochure'
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Temporary RBAC debug endpoint
exports.router.get('/public/inspect-rbac', async (req, res) => {
    try {
        const { data: users } = await supabase_1.supabase.from('users').select('*').eq('email', 'examplatform@edu.in');
        let userRoles = [];
        let permissions = [];
        if (users && users.length > 0) {
            const { data: ur } = await supabase_1.supabase.from('user_roles').select('*, roles(*)').eq('user_id', users[0].id);
            userRoles = ur || [];
            const { data: rp } = await supabase_1.supabase.from('role_permissions').select('*, roles(*), permissions(*)').in('role_id', userRoles.map(u => u.role_id));
            permissions = rp || [];
        }
        const { data: allRoles } = await supabase_1.supabase.from('roles').select('*');
        const { data: allPerms } = await supabase_1.supabase.from('permissions').select('*');
        res.json({
            user: users?.[0] || null,
            userRoles,
            permissions: permissions.map(p => ({
                role: p.roles?.name,
                permissionCode: p.permissions?.code,
                permissionName: p.permissions?.name
            })),
            allRoles,
            allPermsCount: allPerms?.length || 0
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
// Parent CRM applications (alias for /v1/admission/application/my)
exports.router.get('/v1/admission/my', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_VIEW_SELF), index_1.applicationController.listMine);
exports.router.post('/v1/admission/apply', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMISSION_CREATE), index_1.applicationController.parentApply);
// 1. GET /me
// 1. GET /me
exports.router.get('/me', async (req, res) => {
    try {
        const userObj = req.context.user;
        let entranceExamEnabled = false;
        if (userObj.roles.includes('PARENT')) {
            const { data: apps } = await supabase_1.supabase
                .from('admission_applications')
                .select('id')
                .eq('created_by', userObj.id)
                .is('deleted_at', null);
            const appIds = apps?.map(a => a.id) || [];
            if (appIds.length > 0) {
                const { data: candidates } = await supabase_1.supabase
                    .from('admission_exam_session_candidates')
                    .select('id')
                    .in('application_id', appIds);
                const candidateIds = candidates?.map(c => c.id) || [];
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
            finance: userObj.roles.some(r => ['ADMIN', 'FINANCE_OFFICER'].includes(r)),
            entrance_exam: userObj.roles.some(r => ['ADMIN', 'EXAM_CELL', 'EXAM_CELL_ADMIN'].includes(r)) || entranceExamEnabled,
            hostel: false
        };
        res.json({
            user: {
                ...userObj,
                enabledFeatures
            }
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// 2. GET /schools/current
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
// 3. GET /academic-years/current
exports.router.get('/academic-years/current', async (req, res) => {
    const school_id = req.context.user.school_id;
    const { data, error } = await supabase_1.supabase.from('academic_years').select('*').eq('school_id', school_id).eq('is_active', true).maybeSingle();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data); // Returns null if not found
});
// 3b. GET /academic-years (All)
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
// 4. POST /academic-years
exports.router.post('/academic-years', async (req, res) => {
    const school_id = req.context.user.school_id;
    const { year_label, is_active } = req.body;
    if (!year_label)
        return res.status(400).json({ error: "Year label is required" });
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
        console.log("[Audit] Running RBAC System Integrity Scan...");
        // 1. Fetch Master Lists
        const { data: dbRoles, error: rolesErr } = await supabase_1.supabase.from('roles').select('id, name, description');
        const { data: dbPerms, error: permsErr } = await supabase_1.supabase.from('permissions').select('id, code, description');
        const { data: dbUserRoles, error: urErr } = await supabase_1.supabase.from('user_roles').select('user_id, role_id');
        const { data: dbRolePerms, error: rpErr } = await supabase_1.supabase.from('role_permissions').select('role_id, permission_id');
        const { data: dbUsers, error: usersErr } = await supabase_1.supabase.from('users').select('id, email, status, login_status');
        if (rolesErr || permsErr || urErr || rpErr || usersErr) {
            throw new Error(`Data fetch failed: ${rolesErr?.message || permsErr?.message || urErr?.message || rpErr?.message || usersErr?.message}`);
        }
        // 2. Perform Checks
        const registeredPermsInCode = Object.values(permissions_1.PERMISSIONS);
        const dbPermCodes = dbPerms.map(p => p.code);
        // Dangling Permissions (DB but not in code definitions, and vice versa)
        const missingInDb = registeredPermsInCode.filter(p => !dbPermCodes.includes(p));
        const unregisteredInCode = dbPermCodes.filter(p => !registeredPermsInCode.includes(p));
        // Duplicate Mappings check in role_permissions
        const pairingCounts = new Map();
        const duplicateMappings = [];
        dbRolePerms.forEach(rp => {
            const key = `${rp.role_id}:${rp.permission_id}`;
            const count = pairingCounts.get(key) || 0;
            pairingCounts.set(key, count + 1);
            if (count > 0) {
                duplicateMappings.push({ role_id: rp.role_id, permission_id: rp.permission_id });
            }
        });
        // Statistics
        const activeUsers = dbUsers.filter(u => u.status === 'active');
        const pendingApprovals = dbUsers.filter(u => u.login_status === 'PENDING');
        res.json({
            timestamp: new Date().toISOString(),
            status: "SECURE",
            summary: {
                total_roles: dbRoles.length,
                total_permissions: dbPerms.length,
                total_role_permission_mappings: dbRolePerms.length,
                total_users: dbUsers.length,
                active_users: activeUsers.length,
                pending_login_approvals: pendingApprovals.length
            },
            dangling_permissions: {
                defined_in_code_but_missing_in_db: missingInDb,
                defined_in_db_but_missing_in_code: unregisteredInCode
            },
            integrity: {
                duplicate_role_permission_mappings: duplicateMappings.length,
                duplicate_mappings_details: duplicateMappings,
                unassigned_roles: dbRoles.filter(r => !dbUserRoles.some(ur => ur.role_id === r.id)).map(r => r.name)
            },
            roles_list: dbRoles.map(r => ({
                id: r.id,
                name: r.name,
                mapped_permissions_count: dbRolePerms.filter(rp => rp.role_id === r.id).length
            }))
        });
    }
    catch (err) {
        console.error("[RBAC Audit Error]:", err);
        res.status(500).json({ error: 'RBAC Audit Failed', message: err.message });
    }
});
// Guard all admin routes under admin.dashboard.view
exports.router.use('/admin', (0, rbac_middleware_1.checkPermission)(permissions_1.PERMISSIONS.ADMIN_DASHBOARD_VIEW));
exports.router.use('/admin', admin_routes_1.adminRouter);
exports.router.use('/admin/bulk', bulk_routes_1.bulkRouter);
exports.router.use('/admin/departments', department_routes_1.default);
