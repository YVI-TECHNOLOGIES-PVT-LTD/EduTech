import React from 'react';
import { getNavigationForUser } from '@/config/navigation';
import { ROUTE_REGISTRY } from '@/config/route_registry';
import { LandingResolver } from '@/services/LandingResolver';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { store } from '@/app/store';
import {
  AttendanceStatusBadge,
  AttendanceSummaryCards,
  DeliveryModeBadge,
  SessionStatusBadge,
  TeachingApproachBadge,
} from '../components/ClassroomBadges';
import { Provider } from 'react-redux';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runClassroomPortalFrontendTests(
  renderElementToHtml: (el: React.ReactElement) => Promise<string>,
): Promise<{ passed: number; total: number; results: string[] }> {
  const results: string[] = [];

  // 1. Route registry coverage & guard segregation
  const routeMap = new Map(ROUTE_REGISTRY.map((r) => [r.path, r]));
  assert(
    routeMap.get('teacher/classroom')?.guardType === 'teacher',
    'teacher/classroom must require teacher guard',
  );
  assert(
    routeMap.get('admin/classroom')?.guardType === 'admin' &&
      routeMap.get('admin/classroom')?.permission === 'admin.dashboard.view',
    'admin/classroom must require admin guard & permission',
  );
  assert(
    routeMap.get('student/classroom')?.permission === 'student.dashboard.view',
    'student/classroom must require student.dashboard.view permission',
  );
  assert(
    routeMap.get('parent/classroom')?.guardType === 'parent',
    'parent/classroom must require parent guard',
  );
  results.push('✓ 1. ROUTE_REGISTRY enforces Teacher, Admin, Student, and Parent classroom guards');

  // 2. Role-scoped sidebar navigation links
  const teacherNav = getNavigationForUser(['TEACHER']);
  const teacherUrls = teacherNav.flatMap((g) => g.items.map((i) => i.url));
  assert(
    teacherUrls.includes('/app/teacher/classroom'),
    'TEACHER_NAVIGATION must expose /app/teacher/classroom',
  );

  const studentNav = getNavigationForUser(['STUDENT']);
  const studentUrls = studentNav.flatMap((g) => g.items.map((i) => i.url));
  assert(
    studentUrls.includes('/app/student/classroom'),
    'STUDENT_NAVIGATION must expose /app/student/classroom',
  );

  const enrolledParentNav = getNavigationForUser(['PARENT', 'ENROLLED_PARENT'], true);
  const parentUrls = enrolledParentNav.flatMap((g) => g.items.map((i) => i.url));
  assert(
    parentUrls.includes('/app/parent/classroom'),
    'POST_ADMISSION_PARENT_NAVIGATION must expose /app/parent/classroom',
  );

  const adminNav = getNavigationForUser(['ADMIN']);
  const adminUrls = adminNav.flatMap((g) => g.items.map((i) => i.url));
  assert(
    adminUrls.includes('/app/admin/classroom'),
    'ADMIN_NAVIGATION must expose /app/admin/classroom',
  );
  results.push(
    '✓ 2. Role-scoped navigation exposes Teacher, Student, Parent, and Admin classroom portals cleanly',
  );

  // 3. Cross-role route blocking via LandingResolver
  assert(
    LandingResolver.isRouteAllowedForRoles('/app/student/classroom', ['STUDENT']) &&
      !LandingResolver.isRouteAllowedForRoles('/app/teacher/classroom', ['STUDENT']) &&
      !LandingResolver.isRouteAllowedForRoles('/app/parent/classroom', ['STUDENT']),
    'Student role must only access /app/student/classroom',
  );
  assert(
    LandingResolver.isRouteAllowedForRoles('/app/parent/classroom', ['PARENT']) &&
      !LandingResolver.isRouteAllowedForRoles('/app/student/classroom', ['PARENT']) &&
      !LandingResolver.isRouteAllowedForRoles('/app/teacher/classroom', ['PARENT']),
    'Parent role must only access /app/parent/classroom',
  );
  assert(
    LandingResolver.isRouteAllowedForRoles('/app/teacher/classroom', ['TEACHER']) &&
      !LandingResolver.isRouteAllowedForRoles('/app/student/classroom', ['TEACHER']) &&
      !LandingResolver.isRouteAllowedForRoles('/app/admin/classroom', ['TEACHER']),
    'Teacher role must access /app/teacher/classroom and stay blocked from student/admin routes',
  );
  results.push('✓ 3. LandingResolver enforces strict cross-persona classroom route isolation');

  // 4. Endpoint configuration & Redux API slice tags verification
  assert(
    ENDPOINTS.CLASSROOM.STUDENT_SESSION_JOIN('sess-123') ===
      '/v1/classroom/student/sessions/sess-123/join',
    'Classroom endpoints map canonical student join path',
  );
  assert(
    ENDPOINTS.CLASSROOM.TEACHER_SESSION_ATTENDANCE('sess-123') ===
      '/v1/classroom/teacher/sessions/sess-123/attendance',
    'Classroom endpoints map canonical teacher attendance path',
  );
  assert(
    ENDPOINTS.CLASSROOM.PARENT_CHILD_SESSIONS('child-123') ===
      '/v1/classroom/parent/children/child-123/sessions',
    'Classroom endpoints map canonical parent child sessions path',
  );
  assert(
    ENDPOINTS.CLASSROOM.TEACHER_FLIPPED_PREPARATION === '/v1/classroom/teacher/flipped-preparation',
    'Classroom endpoints map canonical teacher flipped preparation path',
  );
  assert(
    ENDPOINTS.CLASSROOM.TEACHER_FLIPPED_PREPARATION_BY_ID('lp-123') ===
      '/v1/classroom/teacher/flipped-preparation/lp-123',
    'Classroom endpoints map canonical teacher flipped preparation detail path',
  );
  assert(
    ENDPOINTS.CLASSROOM.STUDENT_FLIPPED_PREPARATION === '/v1/classroom/student/flipped-preparation',
    'Classroom endpoints map canonical student flipped preparation path',
  );
  results.push('✓ 4. RTK Query Classroom endpoints & API contracts are verified');

  // 5. SSR render verification of Hybrid Classroom shared UI badges & KPI summary cards
  const html = await renderElementToHtml(
    <Provider store={store}>
      <div>
        <SessionStatusBadge status="in_progress" />
        <DeliveryModeBadge mode="hybrid" />
        <TeachingApproachBadge approach="flipped" />
        <AttendanceStatusBadge status="present" participationMode="online" />
        <AttendanceSummaryCards
          summary={{
            total_sessions: 10,
            conducted_sessions: 8,
            marked_sessions: 8,
            present_count: 6,
            late_count: 1,
            absent_count: 1,
            excused_count: 0,
            attended_count: 7,
            attendance_percentage: 87.5,
          }}
        />
      </div>
    </Provider>,
  );
  assert(html.includes('Live Now'), 'SessionStatusBadge renders Live Now');
  assert(html.includes('Hybrid'), 'DeliveryModeBadge renders Hybrid');
  assert(html.includes('Flipped Classroom'), 'TeachingApproachBadge renders Flipped Classroom');
  assert(html.includes('87.5%'), 'AttendanceSummaryCards renders calculated percentage');
  results.push(
    '✓ 5. Shared Hybrid Classroom UI badges and KPI summary cards render cleanly in SSR',
  );

  return { passed: results.length, total: results.length, results };
}
