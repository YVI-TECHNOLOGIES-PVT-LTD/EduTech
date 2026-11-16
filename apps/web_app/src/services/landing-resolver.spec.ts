import { LandingResolver } from './LandingResolver';
import { PermissionProfileResolver } from '../modules/dashboard/core/PermissionProfileResolver';
import { DASHBOARD_CONSTANTS } from '../modules/dashboard/constants/DashboardConstants';

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`${message} — expected "${String(expected)}", got "${String(actual)}"`);
  }
}

export function runLandingResolverAndFrontendRbacTests() {
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ ${name}: ${err?.message || String(err)}`);
      failed++;
    }
  }

  test('1. LandingResolver.normalizeRole aligns with backend canonical role names', () => {
    assertEqual(LandingResolver.normalizeRole('Administrator'), 'ADMIN', 'Administrator');
    assertEqual(LandingResolver.normalizeRole('administrator'), 'ADMIN', 'administrator');
    assertEqual(LandingResolver.normalizeRole('admin'), 'ADMIN', 'admin');
    assertEqual(LandingResolver.normalizeRole('ORG_ADMIN'), 'ADMIN', 'ORG_ADMIN');
    assertEqual(LandingResolver.normalizeRole('org-admin'), 'ADMIN', 'org-admin');
    assertEqual(LandingResolver.normalizeRole('Super Administrator'), 'SUPERADMIN', 'Super Admin');
    assertEqual(LandingResolver.normalizeRole('SUPER_ADMIN'), 'SUPERADMIN', 'SUPER_ADMIN');
    assertEqual(LandingResolver.normalizeRole('Principal'), 'HOI', 'Principal');
    assertEqual(LandingResolver.normalizeRole('Head of Institute'), 'HOI', 'Head of Institute');
    assertEqual(LandingResolver.normalizeRole('Faculty'), 'TEACHER', 'Faculty');
    assertEqual(LandingResolver.normalizeRole('Teacher'), 'TEACHER', 'Teacher');
    assertEqual(LandingResolver.normalizeRole('Front Office'), 'FRONT_OFFICE', 'Front Office');
    assertEqual(LandingResolver.normalizeRole('Receptionist'), 'FRONT_OFFICE', 'Receptionist');
    assertEqual(LandingResolver.normalizeRole('Finance'), 'FINANCE_OFFICER', 'Finance');
    assertEqual(
      LandingResolver.normalizeRole('Finance Manager'),
      'FINANCE_MANAGER',
      'Finance Manager',
    );
    assertEqual(LandingResolver.normalizeRole('Accountant'), 'ACCOUNTANT', 'Accountant');
    assertEqual(LandingResolver.normalizeRole('Staff'), 'STAFF', 'Staff');
    assertEqual(LandingResolver.normalizeRole('Student'), 'STUDENT', 'Student');
    assertEqual(LandingResolver.normalizeRole('Guardian'), 'PARENT', 'Guardian');
  });

  test('2. LandingResolver.resolveLandingRoute resolves Admin/SuperAdmin/Teacher/Finance/FrontOffice/Student/Parent deterministically', () => {
    assertEqual(
      LandingResolver.resolveLandingRoute(['Administrator']),
      '/app/admin/dashboard',
      'Administrator landing',
    );
    assertEqual(
      LandingResolver.resolveLandingRoute(['ADMIN']),
      '/app/admin/dashboard',
      'ADMIN landing',
    );
    assertEqual(
      LandingResolver.resolveLandingRoute(['Super Administrator']),
      '/app/super-admin/dashboard',
      'Super Administrator landing',
    );
    assertEqual(
      LandingResolver.resolveLandingRoute(['Faculty']),
      '/app/teacher/dashboard',
      'Faculty landing',
    );
    assertEqual(
      LandingResolver.resolveLandingRoute(['Finance Officer']),
      '/app/finance/dashboard',
      'Finance Officer landing',
    );
    assertEqual(
      LandingResolver.resolveLandingRoute(['Front Office']),
      '/app/front-office/dashboard',
      'Front Office landing',
    );
    assertEqual(
      LandingResolver.resolveLandingRoute(['Staff']),
      '/app/front-office/dashboard',
      'Staff landing',
    );
    assertEqual(
      LandingResolver.resolveLandingRoute(['Student']),
      '/app/student/dashboard',
      'Student landing',
    );
    assertEqual(
      LandingResolver.resolveLandingRoute(['Parent']),
      '/app/parent/dashboard',
      'Parent landing',
    );
  });

  test('3. LandingResolver.resolveLandingRoute suppresses repeated debug log spam on re-renders', () => {
    const origDebug = console.debug;
    let debugCount = 0;
    console.debug = () => {
      debugCount++;
    };
    try {
      // First resolution for a distinct role/destination may log once; repeated identical calls must log 0 times
      LandingResolver.resolveLandingRoute(['STUDENT']);
      const afterFirst = debugCount;
      for (let i = 0; i < 10; i++) {
        LandingResolver.resolveLandingRoute(['STUDENT']);
      }
      assertEqual(debugCount, afterFirst, 'Repeated render calls must not emit debug logs');
    } finally {
      console.debug = origDebug;
    }
  });

  test('4. PermissionProfileResolver recognizes DASHBOARD_VIEW_ADMIN, admin.dashboard.view, faculty & admission views', () => {
    const adminByCode = PermissionProfileResolver.resolve(['DASHBOARD_VIEW_ADMIN']);
    assertEqual(
      adminByCode.profile,
      DASHBOARD_CONSTANTS.ROLES.ADMIN,
      'DASHBOARD_VIEW_ADMIN profile',
    );
    assertEqual(adminByCode.homeRoute, '/app/admin/dashboard', 'DASHBOARD_VIEW_ADMIN homeRoute');

    const adminByDot = PermissionProfileResolver.resolve(['admin.dashboard.view']);
    assertEqual(
      adminByDot.profile,
      DASHBOARD_CONSTANTS.ROLES.ADMIN,
      'admin.dashboard.view profile',
    );

    const frontOffice = PermissionProfileResolver.resolve(['admission.dashboard.view']);
    assertEqual(
      frontOffice.homeRoute,
      '/app/front-office/dashboard',
      'Front Office must NOT resolve to admin dashboard',
    );

    const teacher = PermissionProfileResolver.resolve(['DASHBOARD_VIEW_FACULTY']);
    assertEqual(teacher.profile, DASHBOARD_CONSTANTS.ROLES.FACULTY, 'Teacher profile');
  });

  test('5. Unmapped roles (e.g. HR) and Exam Cell resolve to safe accessible routes without bouncing to /app/unauthorized', () => {
    assertEqual(
      LandingResolver.resolveLandingRoute(['HR']),
      '/app/profile',
      'HR must resolve to /app/profile instead of /app/parent/dashboard',
    );
    assertEqual(
      LandingResolver.resolveLandingRoute(['Librarian']),
      '/app/profile',
      'Unknown role fallback must resolve to /app/profile',
    );
    assertEqual(
      LandingResolver.resolveLandingRoute(['EXAM_CELL']),
      '/app/front-office/dashboard',
      'EXAM_CELL landing',
    );
    assertEqual(
      LandingResolver.resolveLandingRoute(['EXAM_CELL_ADMIN']),
      '/app/front-office/dashboard',
      'EXAM_CELL_ADMIN landing',
    );
  });

  test('6. LandingResolver.isRouteAllowedForRoles rejects /app/unauthorized and cross-role post-login redirects', () => {
    for (const roles of [
      ['SUPERADMIN'],
      ['ADMIN'],
      ['TEACHER'],
      ['FRONT_OFFICE'],
      ['FINANCE_OFFICER'],
      ['PARENT'],
      ['STUDENT'],
      ['HR'],
    ]) {
      assertEqual(
        LandingResolver.isRouteAllowedForRoles('/app/unauthorized', roles),
        false,
        `${roles.join(',')} must never preserve /app/unauthorized as from redirect`,
      );
      assertEqual(
        LandingResolver.isRouteAllowedForRoles('/app/dashboard', roles),
        false,
        `${roles.join(',')} must not preserve /app/dashboard as from redirect`,
      );
      assertEqual(
        LandingResolver.isRouteAllowedForRoles('/app/profile', roles),
        true,
        `${roles.join(',')} can access shared /app/profile`,
      );
    }

    assertEqual(
      LandingResolver.isRouteAllowedForRoles('/app/super-admin/dashboard', ['ADMIN']),
      false,
      'ADMIN must not be bounced to /app/super-admin/dashboard on login',
    );
    assertEqual(
      LandingResolver.isRouteAllowedForRoles('/app/super-admin/dashboard', ['SUPER_ADMIN']),
      true,
      'SUPER_ADMIN retains /app/super-admin/dashboard redirect',
    );
    assertEqual(
      LandingResolver.isRouteAllowedForRoles('/app/academic/structure', ['TEACHER']),
      false,
      'TEACHER must not retain /app/academic/structure redirect',
    );
    assertEqual(
      LandingResolver.isRouteAllowedForRoles('/app/academic/resources', ['TEACHER']),
      true,
      'TEACHER retains shared /app/academic/resources redirect',
    );
    assertEqual(
      LandingResolver.isRouteAllowedForRoles('/app/teacher/dashboard', ['PARENT']),
      false,
      'PARENT must not retain /app/teacher/dashboard redirect',
    );
    assertEqual(
      LandingResolver.isRouteAllowedForRoles('/app/student/dashboard', ['PARENT']),
      false,
      'PARENT must not retain /app/student/dashboard redirect',
    );
    assertEqual(
      LandingResolver.isRouteAllowedForRoles('/app/admissions/app-123', ['PARENT']),
      true,
      'PARENT retains /app/admissions/:id redirect',
    );
    assertEqual(
      LandingResolver.isRouteAllowedForRoles('/app/parent/dashboard', ['STUDENT']),
      false,
      'STUDENT must not retain /app/parent/dashboard redirect',
    );
    assertEqual(
      LandingResolver.isRouteAllowedForRoles('/app/student/dashboard', ['STUDENT']),
      true,
      'STUDENT retains /app/student/dashboard redirect',
    );
    assertEqual(
      LandingResolver.isRouteAllowedForRoles('/app/parent/dashboard', ['HR']),
      false,
      'HR must not retain /app/parent/dashboard redirect',
    );
  });

  console.log(`\n[LandingResolver Frontend Suite] ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    throw new Error(`${failed} frontend regression test(s) failed`);
  }
}
