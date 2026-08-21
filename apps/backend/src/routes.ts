import { Router, Request, Response } from 'express';
import { authenticate, authenticateOptional, checkLoginApproval } from './auth/auth.middleware';
import { publicAuthRouter, protectedAuthRouter } from './auth/auth.routes';
import { AuthController } from './auth/auth.controller';
import { resolveTenantMiddleware } from './middlewares/tenant.middleware';
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
import {
  applicationController,
  publicApplicationController,
  enquiryController,
} from './modules/admission/index';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { importRouter } from './modules/import/import.routes';
import departmentRouter from './modules/departments/department.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { bulkRouter } from './modules/admin/bulk.routes';

import { workflowRouter } from './workflows/workflow.routes';
import { taskRouter } from './workflows/task.routes';
import { leadRouter } from './modules/lead-management/routes/lead.routes';

const isUuidStr = (str?: string) =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
import { admissionRouter as admissionManagementRouter } from './modules/admission-management/routes/admission.routes';
import { AdmissionController as AdmissionManagementController } from './modules/admission-management/controllers/admission.controller';

import { studentRouter as studentManagementRouter } from './modules/student-management/routes/student.routes';
import { parentRouter as parentManagementRouter } from './modules/parent-management/routes/parent.routes';
import { academicRouter as academicManagementRouter } from './modules/academic-management/routes/academic.routes';
import { staffRouter as staffManagementRouter } from './modules/staff-management/routes/staff.routes';
import { userRouter as userManagementRouter } from './modules/user-management/routes/user.routes';
import { notificationRouter, NotificationSubscriber } from './modules/notifications';

NotificationSubscriber.register();

import { env } from './config/env';

export const router = Router();

// ======================================
// PUBLIC SYSTEM PROBES
// ======================================
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/health/liveness', (req: Request, res: Response) => {
  res.json({ status: 'alive', service: 'edutrack-api', timestamp: new Date().toISOString() });
});

import prisma from './lib/prismaClient';

router.get('/health/readiness', async (req: Request, res: Response) => {
  try {
    await prisma.organizations.findFirst({ select: { org_id: true } });
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
      error: 'Database connection check failed',
    });
  }
});

router.get('/system/info', (req: Request, res: Response) => {
  res.json({ mode: env.SYSTEM_MODE });
});

// ======================================
// PUBLIC AUTHENTICATION ROUTER (Before Global Auth Middleware)
// Handles: /auth/login, /v1/auth/login, /auth/refresh, /v1/auth/refresh
// ======================================
router.use('/auth', publicAuthRouter);
router.use('/v1/auth', publicAuthRouter);

// Exposed Admission Route for registration & Guest Drafts (CRM pipeline)
router.post('/v1/admission/register', resolveTenantMiddleware, AuthController.registerParent);
router.post('/v1/admission/verify-otp', AuthController.verifyOtp);
router.post('/v1/admission/public-apply', publicApplicationController.apply);
router.post('/admissions/public-apply', publicApplicationController.apply);
router.post('/admissions', authenticateOptional, AdmissionController.create);

// Public Online Enquiry Endpoints (Website Visitors)
router.get('/v1/admission/crm/query-types', enquiryController.getQueryTypes);
router.get('/v1/admission/query-types', enquiryController.getQueryTypes);
router.get('/admission/query-types', enquiryController.getQueryTypes);
router.post(
  '/v1/admission/crm/enquiries',
  resolveTenantMiddleware,
  authenticateOptional,
  enquiryController.create,
);
router.post(
  '/v1/admission/enquiries',
  resolveTenantMiddleware,
  authenticateOptional,
  enquiryController.create,
);

// Public lookup for schools/organizations
router.get('/schools', async (req: Request, res: Response) => {
  try {
    const orgs = await prisma.organizations.findMany({
      where: { status: 'active' },
      select: { org_id: true, org_name: true, org_code: true },
      take: 10,
    });
    res.json(orgs.map((o) => ({ id: o.org_id, name: o.org_name, code: o.org_code })));
  } catch (error: any) {
    res.status(200).json([]);
  }
});

// v1-prefixed alias so {{baseUrl}}/schools works with baseUrl=http://localhost:3000/api/v1
router.get('/v1/schools', async (req: Request, res: Response) => {
  try {
    const orgs = await prisma.organizations.findMany({
      where: { status: 'active' },
      select: { org_id: true, org_name: true, org_code: true },
      take: 10,
    });
    res.json(orgs.map((o) => ({ id: o.org_id, name: o.org_name, code: o.org_code })));
  } catch (error: any) {
    res.status(200).json([]);
  }
});

// Public lookup for current year
router.get('/public/academic-year', async (req: Request, res: Response) => {
  try {
    const year = await prisma.academic_years.findFirst({
      orderBy: { created_at: 'desc' },
      select: { academic_year_id: true, academic_year_name: true },
    });
    res.json(year ? { id: year.academic_year_id, year_label: year.academic_year_name } : null);
  } catch (error: any) {
    res.status(200).json(null);
  }
});

// v1-prefixed alias
router.get('/v1/public/academic-year', async (req: Request, res: Response) => {
  try {
    const year = await prisma.academic_years.findFirst({
      orderBy: { created_at: 'desc' },
      select: { academic_year_id: true, academic_year_name: true },
    });
    res.json(year ? { id: year.academic_year_id, year_label: year.academic_year_name } : null);
  } catch (error: any) {
    res.status(200).json(null);
  }
});

import { academic_year_status } from '@prisma/client';

// Public lookup for academic years of a school
router.get('/public/academic-years', async (req: Request, res: Response) => {
  try {
    const targetOrgId = (req.query.school_id ||
      req.query.org_id ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id) as string;
    if (!targetOrgId) {
      return res
        .status(400)
        .json({ error: 'School ID (school_id or org_id) parameter is required' });
    }

    const years = await prisma.academic_years.findMany({
      where: { org_id: targetOrgId },
      orderBy: { created_at: 'desc' },
      select: { academic_year_id: true, academic_year_name: true, status: true },
    });
    res.json(
      years.map((y) => ({
        id: y.academic_year_id,
        year_label: y.academic_year_name,
        is_active:
          y.status === academic_year_status.admissions_open ||
          y.status === academic_year_status.open ||
          y.status === academic_year_status.planning,
      })),
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// v1-prefixed alias
router.get('/v1/public/academic-years', async (req: Request, res: Response) => {
  try {
    const targetOrgId = (req.query.school_id ||
      req.query.org_id ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id) as string;
    if (!targetOrgId) {
      return res
        .status(400)
        .json({ error: 'School ID (school_id or org_id) parameter is required' });
    }
    const years = await prisma.academic_years.findMany({
      where: { org_id: targetOrgId },
      orderBy: { created_at: 'desc' },
      select: { academic_year_id: true, academic_year_name: true, status: true },
    });
    res.json(
      years.map((y) => ({
        id: y.academic_year_id,
        year_label: y.academic_year_name,
        is_active:
          y.status === academic_year_status.admissions_open ||
          y.status === academic_year_status.open ||
          y.status === academic_year_status.planning,
      })),
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/public/classes', async (req: Request, res: Response) => {
  try {
    let targetOrgId = (req.query.school_id ||
      req.query.org_id ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id) as string;
    if (!targetOrgId || targetOrgId === 'school-main' || targetOrgId === 'org-main') {
      const activeOrg =
        (await prisma.organizations.findFirst({ where: { status: 'active' } })) ||
        (await prisma.organizations.findFirst());
      if (activeOrg) targetOrgId = activeOrg.org_id;
    }
    if (!targetOrgId) {
      return res
        .status(400)
        .json({ error: 'School ID (school_id or org_id) parameter is required' });
    }

    const { academic_year_id } = req.query;
    let targetYearId = isUuidStr(academic_year_id as string) ? (academic_year_id as string) : '';
    if (!targetYearId && targetOrgId && isUuidStr(targetOrgId)) {
      const activeYear = await prisma.academic_years.findFirst({
        where: { org_id: targetOrgId },
        orderBy: { created_at: 'desc' },
      });
      targetYearId = activeYear?.academic_year_id || '';
    }

    let aygList: any[] = [];
    if (targetYearId && isUuidStr(targetYearId)) {
      aygList = await prisma.academic_year_grades.findMany({
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
      const grades = await prisma.grades.findMany({
        where: { org_id: targetOrgId, is_active: true },
        orderBy: { display_order: 'asc' },
      });

      const seenGrades = new Set<string>();
      const uniqueGrades: any[] = [];
      for (const g of grades) {
        const key = `${g.grade_name}_${g.board || ''}`;
        if (!seenGrades.has(key)) {
          seenGrades.add(key);
          uniqueGrades.push(g);
        }
      }

      return res.json(
        uniqueGrades.map((g) => ({
          id: g.grade_id,
          academic_year_grade_id: g.grade_id,
          grade_id: g.grade_id,
          name: g.grade_name,
          grade_name: g.grade_name,
          board: g.board || 'CBSE',
          code: g.grade_code,
        })),
      );
    }

    const seenAygKeys = new Set<string>();
    const uniqueAygList: any[] = [];
    for (const ayg of aygList) {
      const gName = ayg.grades?.grade_name || ayg.grade_id;
      const key = `${gName}_${ayg.grades?.board || ''}`;
      if (!seenAygKeys.has(key)) {
        seenAygKeys.add(key);
        uniqueAygList.push(ayg);
      }
    }

    res.json(
      uniqueAygList.map((ayg) => ({
        id: ayg.academic_year_grade_id,
        academic_year_grade_id: ayg.academic_year_grade_id,
        grade_id: ayg.grade_id,
        name: ayg.grades.grade_name,
        grade_name: ayg.grades.grade_name,
        board: ayg.grades.board || 'CBSE',
        code: ayg.grades.grade_code,
        display_order: ayg.grades.display_order,
      })),
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// v1-prefixed alias
router.get('/v1/public/classes', async (req: Request, res: Response) => {
  try {
    let targetOrgId = (req.query.school_id ||
      req.query.org_id ||
      req.context?.user?.org_id ||
      req.context?.user?.school_id) as string;
    if (!targetOrgId || targetOrgId === 'school-main' || targetOrgId === 'org-main') {
      const activeOrg =
        (await prisma.organizations.findFirst({ where: { status: 'active' } })) ||
        (await prisma.organizations.findFirst());
      if (activeOrg) targetOrgId = activeOrg.org_id;
    }
    if (!targetOrgId) {
      return res
        .status(400)
        .json({ error: 'School ID (school_id or org_id) parameter is required' });
    }
    const { academic_year_id } = req.query;

    let targetYearId = isUuidStr(academic_year_id as string) ? (academic_year_id as string) : '';
    if (!targetYearId && targetOrgId && isUuidStr(targetOrgId)) {
      const activeYear = await prisma.academic_years.findFirst({
        where: { org_id: targetOrgId },
        orderBy: { created_at: 'desc' },
      });
      targetYearId = activeYear?.academic_year_id || '';
    }
    let aygList: any[] = [];
    if (targetYearId && isUuidStr(targetYearId)) {
      aygList = await prisma.academic_year_grades.findMany({
        where: { academic_year_id: targetYearId, is_active: true },
        include: { grades: true },
        orderBy: { grades: { display_order: 'asc' } },
      });
    }
    if (aygList.length === 0 && targetOrgId) {
      const grades = await prisma.grades.findMany({
        where: { org_id: targetOrgId, is_active: true },
        orderBy: { display_order: 'asc' },
      });
      const seenGrades = new Set<string>();
      const uniqueGrades: any[] = [];
      for (const g of grades) {
        const key = `${g.grade_name}_${g.board || ''}`;
        if (!seenGrades.has(key)) {
          seenGrades.add(key);
          uniqueGrades.push(g);
        }
      }
      return res.json(
        uniqueGrades.map((g) => ({
          id: g.grade_id,
          academic_year_grade_id: g.grade_id,
          grade_id: g.grade_id,
          name: g.grade_name,
          grade_name: g.grade_name,
          board: g.board || 'CBSE',
          code: g.grade_code,
        })),
      );
    }

    const seenAygKeys = new Set<string>();
    const uniqueAygList: any[] = [];
    for (const ayg of aygList) {
      const gName = ayg.grades?.grade_name || ayg.grade_id;
      const key = `${gName}_${ayg.grades?.board || ''}`;
      if (!seenAygKeys.has(key)) {
        seenAygKeys.add(key);
        uniqueAygList.push(ayg);
      }
    }

    res.json(
      uniqueAygList.map((ayg) => ({
        id: ayg.academic_year_grade_id,
        academic_year_grade_id: ayg.academic_year_grade_id,
        grade_id: ayg.grade_id,
        name: ayg.grades.grade_name,
        grade_name: ayg.grades.grade_name,
        board: ayg.grades.board || 'CBSE',
        code: ayg.grades.grade_code,
        display_order: ayg.grades.display_order,
      })),
    );
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Public lookup for transport routes of a school
router.get('/public/transport-routes', async (req: Request, res: Response) => {
  res.json([]);
});

// Public lookup for fee structures of a school
router.get('/public/fee-structures', async (req: Request, res: Response) => {
  res.json([]);
});

// Public lookup for admission grades (mapping layer)
router.get('/public/admission/grades', async (req: Request, res: Response) => {
  try {
    const { school_id, academic_year_id } = req.query;
    let targetOrgId = school_id as string;
    if (!targetOrgId) {
      const activeOrg = await prisma.organizations.findFirst({ where: { status: 'active' } });
      targetOrgId = activeOrg?.org_id || '';
    }
    let targetYearId = academic_year_id as string;
    if (!targetYearId && targetOrgId) {
      const activeYear = await prisma.academic_years.findFirst({
        where: { org_id: targetOrgId },
        orderBy: { created_at: 'desc' },
      });
      targetYearId = activeYear?.academic_year_id || '';
    }

    let aygList: any[] = [];
    if (targetYearId) {
      aygList = await prisma.academic_year_grades.findMany({
        where: { academic_year_id: targetYearId, is_active: true },
        include: { grades: true },
        orderBy: { grades: { display_order: 'asc' } },
      });
    }

    if (aygList.length === 0 && targetOrgId) {
      const grades = await prisma.grades.findMany({
        where: { org_id: targetOrgId, is_active: true },
        orderBy: { display_order: 'asc' },
      });
      return res.json(
        grades.map((g) => ({
          id: g.grade_id,
          grade_id: g.grade_id,
          grade_name: g.grade_name,
          board: g.board || 'CBSE',
        })),
      );
    }

    res.json(
      aygList.map((ayg) => ({
        id: ayg.academic_year_grade_id,
        academic_year_grade_id: ayg.academic_year_grade_id,
        grade_id: ayg.grade_id,
        grade_name: ayg.grades.grade_name,
        board: ayg.grades.board || 'CBSE',
      })),
    );
  } catch (error: any) {
    res.status(200).json([]);
  }
});

// Shared Prisma-backed handler for the admission config public lookup.
// Both /public/admission/config and /v1/public/admission/config delegate here
// so there is exactly ONE implementation — no dual-implementation risk.
const admissionConfigHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawSchoolId = (req.query.school_id || req.query.org_id) as string | undefined;
    const cleanSchoolId =
      typeof rawSchoolId === 'string' &&
      rawSchoolId.trim() !== '' &&
      rawSchoolId !== 'undefined' &&
      rawSchoolId !== 'null'
        ? rawSchoolId.trim()
        : '';

    const targetOrgId =
      cleanSchoolId ||
      ((req.context?.user?.org_id || req.context?.user?.school_id) as string) ||
      '';

    const schools = await prisma.organizations.findMany({
      where: { status: 'active' },
      select: { org_id: true, org_name: true, org_code: true },
      orderBy: { org_name: 'asc' },
    });

    let activeYear = null;
    if (targetOrgId) {
      const yr = await prisma.academic_years.findFirst({
        where: { org_id: targetOrgId },
        orderBy: { created_at: 'desc' },
        select: { academic_year_id: true, academic_year_name: true },
      });
      if (yr) activeYear = { id: yr.academic_year_id, year_label: yr.academic_year_name };
    }

    const grades = targetOrgId
      ? await prisma.grades.findMany({
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
  } catch (error: any) {
    console.error('[admissionConfigHandler] Error:', error?.message || error);
    res.status(503).json({
      error: 'Admission configuration is temporarily unavailable. Please try again.',
      code: 'SERVICE_UNAVAILABLE',
    });
  }
};

// Consolidated public configuration for admissions (versioned metadata)
// Uses the shared Prisma-backed handler — SAME implementation as /v1/public/admission/config
router.get('/public/admission/config', admissionConfigHandler);

// v1-prefixed alias — delegates to the SAME shared handler (zero implementation drift)
router.get('/v1/public/admission/config', admissionConfigHandler);

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

// Protected Auth Router
router.use('/auth', protectedAuthRouter);
router.use('/v1/auth', protectedAuthRouter);

// Parent CRM applications (alias for /v1/applications/mine)
router.get(
  '/v1/admission/my',
  checkPermission(PERMISSIONS.ADMISSION_VIEW_SELF),
  AdmissionManagementController.getMine,
);

router.post(
  '/v1/admission/apply',
  checkPermission(PERMISSIONS.ADMISSION_CREATE),
  AdmissionManagementController.create,
);

// 1. GET /me & GET /auth/me
const handleMe = async (req: Request, res: Response) => {
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
};

router.get('/me', handleMe);
router.get('/auth/me', handleMe);
router.get('/v1/auth/me', handleMe);

// 2. GET /schools/current
router.get('/schools/current', async (req: Request, res: Response) => {
  const school_id = req.context!.user.school_id;
  if (!school_id) return res.status(404).json({ error: 'User not assigned to a school' });

  const { data, error } = await supabase.from('schools').select('*').eq('id', school_id).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

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

// Notification Management Module
router.use('/v1/notifications', authenticate, notificationRouter);
router.use('/notifications', authenticate, notificationRouter);
