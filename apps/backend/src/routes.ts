import { Router, Request, Response } from 'express';
import { authenticate, authenticateOptional, checkLoginApproval } from './auth/auth.middleware';
import { checkPermission } from './rbac/rbac.middleware';
import { PERMISSIONS } from './rbac/permissions';
import { supabase } from './config/supabase';
import { admissionRouter } from './modules/admission/admission.routes';
import { crmRouter } from './modules/admission/crm.routes';
import { applicationRouter } from './modules/admission/application.routes';
import { documentRouter } from './modules/admission/document.routes';
import { evaluationRouter } from './modules/admission/evaluation.routes';
import { assessmentRouter } from './modules/admission/assessment.routes';
import { enrollmentRouter } from './modules/admission/enrollment.routes';
import { AdmissionController } from './modules/admission/admission.controller';
import { applicationController, publicApplicationController } from './modules/admission/index';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { importRouter } from './modules/import/import.routes';
import departmentRouter from './modules/departments/department.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { bulkRouter } from './modules/admin/bulk.routes';
import { workflowRouter } from './workflows/workflow.routes';
import { taskRouter } from './workflows/task.routes';
import { leadRouter } from './modules/lead-management/routes/lead.routes';
import { admissionRouter as admissionManagementRouter } from './modules/admission-management/routes/admission.routes';
import { studentRouter as studentManagementRouter } from './modules/student-management/routes/student.routes';
import { parentRouter as parentManagementRouter } from './modules/parent-management/routes/parent.routes';
import { academicRouter as academicManagementRouter } from './modules/academic-management/routes/academic.routes';
import { staffRouter as staffManagementRouter } from './modules/staff-management/routes/staff.routes';
import { userRouter as userManagementRouter } from './modules/user-management/routes/user.routes';

import { env } from './config/env';

export const router = Router();

// ======================================
// PUBLIC
// ======================================
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/health/liveness', (req: Request, res: Response) => {
  res.json({ status: 'alive', service: 'edutrack-api', timestamp: new Date().toISOString() });
});

router.get('/health/readiness', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('schools').select('id').limit(1);
    if (error) throw error;
    res.json({
      status: 'ready',
      service: 'edutrack-api',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'edutrack-api',
      database: 'disconnected',
      error: err.message,
    });
  }
});

router.get('/system/info', (req: Request, res: Response) => {
  res.json({ mode: env.SYSTEM_MODE });
});

// Exposed Admission Route for registration & Guest Drafts (CRM pipeline)
router.post('/v1/admission/public-apply', publicApplicationController.apply);
router.post('/admissions/public-apply', publicApplicationController.apply);
router.post('/admissions', authenticateOptional, AdmissionController.create);

// Public lookup for schools
// Public lookup for schools
router.get('/schools', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('schools').select('id, name, code').limit(10);
    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(200).json([]); // Suppress error for public view
  }
});

// Public lookup for current year (required for registration if not hardcoded)
// Public lookup for current year (required for registration if not hardcoded)
router.get('/public/academic-year', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('academic_years')
      .select('id, year_label')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    res.json(data); // Returns null if not found, with 200 OK
  } catch (error: any) {
    res.status(200).json(null);
  }
});

// Public lookup for academic years of a school
router.get('/public/academic-years', async (req: Request, res: Response) => {
  try {
    const { school_id } = req.query;
    if (!school_id) return res.status(400).json({ error: 'school_id is required' });
    const { data, error } = await supabase
      .from('academic_years')
      .select('id, year_label, is_active')
      .eq('school_id', school_id)
      .order('year_label', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(200).json([]);
  }
});

// Public lookup for classes/grades of a school
router.get('/public/classes', async (req: Request, res: Response) => {
  try {
    const { school_id } = req.query;
    if (!school_id) return res.status(400).json({ error: 'school_id is required' });
    const { data, error } = await supabase
      .from('classes')
      .select('id, name')
      .eq('school_id', school_id)
      .order('name');

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(200).json([]);
  }
});

// Public lookup for transport routes of a school
router.get('/public/transport-routes', async (req: Request, res: Response) => {
  try {
    const { school_id } = req.query;
    if (!school_id) return res.status(400).json({ error: 'school_id is required' });
    const { data, error } = await supabase
      .from('transport_routes')
      .select('id, name')
      .eq('school_id', school_id)
      .order('name');

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(200).json([]);
  }
});

// Public lookup for fee structures of a school
router.get('/public/fee-structures', async (req: Request, res: Response) => {
  try {
    const { school_id } = req.query;
    if (!school_id) return res.status(400).json({ error: 'school_id is required' });
    const { data, error } = await supabase
      .from('fee_structures')
      .select('id, name, amount')
      .eq('school_id', school_id)
      .order('name');

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(200).json([]);
  }
});

// Public lookup for admission grades (mapping layer)
router.get('/public/admission/grades', async (req: Request, res: Response) => {
  try {
    const { school_id } = req.query;
    if (!school_id) return res.status(400).json({ error: 'school_id is required' });
    const { data, error } = await supabase
      .from('classes')
      .select('id, name')
      .eq('school_id', school_id)
      .order('name');

    if (error) throw error;
    // Return mapped list of grades/classes (just id and grade_name)
    res.json(data?.map((c) => ({ id: c.id, grade_name: c.name })) || []);
  } catch (error: any) {
    res.status(200).json([]);
  }
});

// Consolidated public configuration for admissions (versioned metadata)
router.get('/public/admission/config', async (req: Request, res: Response) => {
  try {
    const { school_id } = req.query;

    // Fetch all schools for selector
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, name, code');
    if (schoolsError) throw schoolsError;

    let activeSchool = null;
    let activeYear = null;
    let gradesList: any[] = [];

    if (school_id) {
      // Fetch selected school details
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id, name, code')
        .eq('id', school_id)
        .maybeSingle();
      if (schoolError) throw schoolError;
      activeSchool = school;

      // Fetch active academic year
      const { data: year, error: yearError } = await supabase
        .from('academic_years')
        .select('id, year_label, is_active')
        .eq('school_id', school_id)
        .eq('is_active', true)
        .maybeSingle();
      if (yearError) throw yearError;
      activeYear = year;

      // Fetch grades (classes mapped cleanly to grades)
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', school_id)
        .order('name');
      if (classesError) throw classesError;
      gradesList = classes?.map((c) => ({ id: c.id, grade_name: c.name })) || [];
    }

    // Dynamically compute the version based on max updated_at of the configurations
    const { data: schoolMax } = await supabase
      .from('schools')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: yearMax } = await supabase
      .from('academic_years')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: classMax } = await supabase
      .from('classes')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const times = [
      schoolMax?.updated_at ? new Date(schoolMax.updated_at).getTime() : 0,
      yearMax?.updated_at ? new Date(yearMax.updated_at).getTime() : 0,
      classMax?.updated_at ? new Date(classMax.updated_at).getTime() : 0,
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
        { type: 'photo', label: 'Student Passport Photo', required: true },
      ],
      admissionCalendar: {
        opens: '2026-10-01',
        closes: '2026-12-15',
        classStarts: '2026-08-15',
      },
      brochure: {
        url: '/brochure.pdf',
        title: 'Greenwood High Admission Brochure',
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Temporary RBAC debug endpoint
router.get('/public/inspect-rbac', async (req: Request, res: Response) => {
  try {
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'examplatform@edu.in');
    let userRoles: any[] = [];
    let permissions: any[] = [];
    if (users && users.length > 0) {
      const { data: ur } = await supabase
        .from('user_roles')
        .select('*, roles(*)')
        .eq('user_id', users[0].id);
      userRoles = ur || [];

      const { data: rp } = await supabase
        .from('role_permissions')
        .select('*, roles(*), permissions(*)')
        .in(
          'role_id',
          userRoles.map((u) => u.role_id),
        );
      permissions = rp || [];
    }
    const { data: allRoles } = await supabase.from('roles').select('*');
    const { data: allPerms } = await supabase.from('permissions').select('*');

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
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ======================================
// PROTECTED (Global Guard)
// ======================================
router.use(authenticate);
router.use(checkLoginApproval);

// Parent CRM applications (alias for /v1/admission/application/my)
router.get(
  '/v1/admission/my',
  checkPermission(PERMISSIONS.ADMISSION_VIEW_SELF),
  applicationController.listMine,
);

router.post(
  '/v1/admission/apply',
  checkPermission(PERMISSIONS.ADMISSION_CREATE),
  applicationController.parentApply,
);

// 1. GET /me
// 1. GET /me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userObj = req.context!.user;
    let entranceExamEnabled = false;

    if (userObj.roles.includes('PARENT')) {
      const { data: apps } = await supabase
        .from('admission_applications')
        .select('id')
        .eq('created_by', userObj.id)
        .is('deleted_at', null);

      const appIds = apps?.map((a) => a.id) || [];
      if (appIds.length > 0) {
        const { data: candidates } = await supabase
          .from('admission_exam_session_candidates')
          .select('id')
          .in('application_id', appIds);

        const candidateIds = candidates?.map((c) => c.id) || [];
        if (candidateIds.length > 0) {
          const { data: activeSessions } = await supabase
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
      entrance_exam:
        userObj.roles.some((r) => ['ADMIN', 'EXAM_CELL', 'EXAM_CELL_ADMIN'].includes(r)) ||
        entranceExamEnabled,
      hostel: false,
    };

    res.json({
      user: {
        ...userObj,
        enabledFeatures,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /schools/current
// 2. GET /schools/current
router.get('/schools/current', async (req: Request, res: Response) => {
  const school_id = req.context!.user.school_id;
  if (!school_id) return res.status(404).json({ error: 'User not assigned to a school' });

  const { data, error } = await supabase.from('schools').select('*').eq('id', school_id).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 3. GET /academic-years/current
// 3. GET /academic-years/current
router.get('/academic-years/current', async (req: Request, res: Response) => {
  const school_id = req.context!.user.school_id;
  const { data, error } = await supabase
    .from('academic_years')
    .select('*')
    .eq('school_id', school_id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data); // Returns null if not found
});

// 3b. GET /academic-years (All)
// 3b. GET /academic-years (All)
router.get('/academic-years', async (req: Request, res: Response) => {
  const school_id = req.context!.user.school_id;
  const { data, error } = await supabase
    .from('academic_years')
    .select('*')
    .eq('school_id', school_id)
    .order('year_label', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 4. POST /academic-years
// 4. POST /academic-years
router.post('/academic-years', async (req: Request, res: Response) => {
  const school_id = req.context!.user.school_id;
  const { year_label, is_active } = req.body;

  if (!year_label) return res.status(400).json({ error: 'Year label is required' });

  // If making this active, deactivate others
  if (is_active) {
    await supabase.from('academic_years').update({ is_active: false }).eq('school_id', school_id);
  }

  const { data, error } = await supabase
    .from('academic_years')
    .insert({ school_id, year_label, is_active: is_active || false })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ======================================
// MODULE ROUTES
// ======================================
router.use('/v1/admission/crm', crmRouter);
router.use('/v1/admission/application/documents', documentRouter);
router.use('/v1/admission/evaluation', evaluationRouter);
router.use('/v1/admission/assessment', assessmentRouter);
router.use('/v1/admission/enrollment', enrollmentRouter);
router.use('/v1/admission/application', applicationRouter);
router.use('/dashboard', dashboardRouter);
router.use('/import', importRouter);
router.use('/v1/workflows', workflowRouter);
router.use('/v1/tasks', taskRouter);

// System RBAC Audit Endpoint
router.get(
  '/system/rbac/audit',
  checkPermission(PERMISSIONS.ADMIN_DASHBOARD_VIEW),
  async (req: Request, res: Response) => {
    try {
      console.log('[Audit] Running RBAC System Integrity Scan...');

      // 1. Fetch Master Lists
      const { data: dbRoles, error: rolesErr } = await supabase
        .from('roles')
        .select('id, name, description');
      const { data: dbPerms, error: permsErr } = await supabase
        .from('permissions')
        .select('id, code, description');
      const { data: dbUserRoles, error: urErr } = await supabase
        .from('user_roles')
        .select('user_id, role_id');
      const { data: dbRolePerms, error: rpErr } = await supabase
        .from('role_permissions')
        .select('role_id, permission_id');
      const { data: dbUsers, error: usersErr } = await supabase
        .from('users')
        .select('id, email, status, login_status');

      if (rolesErr || permsErr || urErr || rpErr || usersErr) {
        throw new Error(
          `Data fetch failed: ${rolesErr?.message || permsErr?.message || urErr?.message || rpErr?.message || usersErr?.message}`,
        );
      }

      // 2. Perform Checks
      const registeredPermsInCode = Object.values(PERMISSIONS);
      const dbPermCodes = dbPerms.map((p) => p.code);

      // Dangling Permissions (DB but not in code definitions, and vice versa)
      const missingInDb = registeredPermsInCode.filter((p) => !dbPermCodes.includes(p));
      const unregisteredInCode = dbPermCodes.filter((p) => !registeredPermsInCode.includes(p));

      // Duplicate Mappings check in role_permissions
      const pairingCounts = new Map<string, number>();
      const duplicateMappings: any[] = [];
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
    } catch (err: any) {
      console.error('[RBAC Audit Error]:', err);
      res.status(500).json({ error: 'RBAC Audit Failed', message: err.message });
    }
  },
);

// Guard all admin routes under admin.dashboard.view
router.use('/admin', checkPermission(PERMISSIONS.ADMIN_DASHBOARD_VIEW));
router.use('/admin', adminRouter);
router.use('/admin/bulk', bulkRouter);
router.use('/admin/departments', departmentRouter);

// Lead Management Module (Phase 3.1)
router.use('/v1/leads', authenticate, leadRouter);
router.use('/leads', authenticate, leadRouter);

// Admission Application Management Module (Phase 3.2)
router.use('/v1/applications', authenticate, admissionManagementRouter);
router.use('/applications', authenticate, admissionManagementRouter);

// Student Management Module (Phase 3.3)
router.use('/v1/students', authenticate, studentManagementRouter);
router.use('/students', authenticate, studentManagementRouter);

// Parent Management Module (Phase 3.4)
router.use('/v1/parents', authenticate, parentManagementRouter);
router.use('/parents', authenticate, parentManagementRouter);

// Academic Structure Management Module (Phase 3.5)
router.use('/v1/academic', authenticate, academicManagementRouter);
router.use('/academic', authenticate, academicManagementRouter);

// Staff Management Module (Phase 3.6)
router.use('/v1/staff', authenticate, staffManagementRouter);
router.use('/staff', authenticate, staffManagementRouter);

// User & Role Administration Module (Phase 3.7)
router.use('/v1/users', authenticate, userManagementRouter);
router.use('/users', authenticate, userManagementRouter);
