import React from 'react';
import { getNavigationForUser } from '@/config/navigation';
import { ROUTE_REGISTRY } from '@/config/route_registry';
import { LandingResolver } from '@/services/LandingResolver';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { store } from '@/app/store';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import {
  ActivityStatusBadge,
  ActivityTypeBadge,
  SubmissionStatusBadge,
  formatFileSize,
} from '../components/LearningActivityBadges';
import { ParentLearningActivitiesPage } from '../pages/ParentLearningActivitiesPage';
import { StudentLearningActivitiesPage } from '../pages/StudentLearningActivitiesPage';
import { TeacherLearningActivitiesPage } from '../pages/TeacherLearningActivitiesPage';
import { AdminLearningActivitiesPage } from '../pages/AdminLearningActivitiesPage';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runLearningActivitiesPortalFrontendTests(
  renderElementToHtml: (el: React.ReactElement) => Promise<string>,
): Promise<{ passed: number; total: number; results: string[] }> {
  const results: string[] = [];

  // 1. Route registry & guard enforcement
  const routeMap = new Map(ROUTE_REGISTRY.map((r) => [r.path, r]));
  assert(
    routeMap.get('teacher/learning-activities')?.guardType === 'teacher',
    'teacher/learning-activities must require teacher guard',
  );
  assert(
    routeMap.get('admin/learning-activities')?.guardType === 'admin' &&
      routeMap.get('admin/learning-activities')?.permission === 'admin.dashboard.view',
    'admin/learning-activities must require admin guard & admin.dashboard.view permission',
  );
  assert(
    routeMap.get('student/learning-activities')?.permission === 'student.dashboard.view',
    'student/learning-activities must require student.dashboard.view permission',
  );
  assert(
    routeMap.get('parent/learning-activities')?.guardType === 'parent',
    'parent/learning-activities must require parent guard',
  );
  results.push('✓ 1. ROUTE_REGISTRY enforces Teacher, Student, Parent, and Admin guards');

  // 2. Role-scoped sidebar navigation
  const teacherUrls = getNavigationForUser(['TEACHER']).flatMap((g) => g.items.map((i) => i.url));
  assert(
    teacherUrls.includes('/app/teacher/learning-activities'),
    'TEACHER_NAVIGATION must include /app/teacher/learning-activities',
  );
  const studentUrls = getNavigationForUser(['STUDENT']).flatMap((g) => g.items.map((i) => i.url));
  assert(
    studentUrls.includes('/app/student/learning-activities'),
    'STUDENT_NAVIGATION must include /app/student/learning-activities',
  );
  const parentUrls = getNavigationForUser(['PARENT', 'ENROLLED_PARENT'], true).flatMap((g) =>
    g.items.map((i) => i.url),
  );
  assert(
    parentUrls.includes('/app/parent/learning-activities'),
    'POST_ADMISSION_PARENT_NAVIGATION must include /app/parent/learning-activities',
  );
  const adminUrls = getNavigationForUser(['ADMIN']).flatMap((g) => g.items.map((i) => i.url));
  assert(
    adminUrls.includes('/app/admin/learning-activities'),
    'ADMIN_NAVIGATION must include /app/admin/learning-activities',
  );
  results.push('✓ 2. Role-scoped sidebar navigation exposes all 4 Learning Activities routes');

  // 3. Cross-role route protection via LandingResolver
  assert(
    LandingResolver.isRouteAllowedForRoles('/app/student/learning-activities', ['STUDENT']) &&
      !LandingResolver.isRouteAllowedForRoles('/app/teacher/learning-activities', ['STUDENT']) &&
      !LandingResolver.isRouteAllowedForRoles('/app/parent/learning-activities', ['STUDENT']),
    'Student role must be restricted to student learning-activities route',
  );
  assert(
    LandingResolver.isRouteAllowedForRoles('/app/parent/learning-activities', ['PARENT']) &&
      !LandingResolver.isRouteAllowedForRoles('/app/student/learning-activities', ['PARENT']) &&
      !LandingResolver.isRouteAllowedForRoles('/app/admin/learning-activities', ['PARENT']),
    'Parent role must be restricted to parent learning-activities route',
  );
  results.push('✓ 3. LandingResolver enforces cross-role route isolation');

  // 4. Endpoint helpers & badge/SSR rendering
  assert(
    ENDPOINTS.LEARNING_ACTIVITIES.STUDENT_ACTIVITY_SUBMIT('act-1') ===
      '/v1/learning-activities/student/activities/act-1/submit',
    'Student submit endpoint mismatch',
  );
  assert(
    ENDPOINTS.LEARNING_ACTIVITIES.PARENT_CHILD_FILE_DOWNLOAD('c-1', 'f-1') ===
      '/v1/learning-activities/parent/children/c-1/files/f-1/download',
    'Parent child file download endpoint mismatch',
  );
  assert(formatFileSize(2048) === '2.0 KB', 'File size formatter mismatch');

  const badgesHtml = await renderElementToHtml(
    <div className="flex gap-2">
      <ActivityTypeBadge type="project" />
      <ActivityTypeBadge type="homework" />
      <ActivityStatusBadge status="published" />
      <SubmissionStatusBadge status="resubmission_requested" />
    </div>,
  );
  assert(
    badgesHtml.includes('Digital Project') &&
      badgesHtml.includes('Homework (Offline)') &&
      badgesHtml.includes('Resubmission Requested'),
    'LearningActivityBadges SSR output incomplete',
  );

  // SSR render smoke check across all 4 role pages wrapped in Redux Provider
  for (const PageComponent of [
    TeacherLearningActivitiesPage,
    StudentLearningActivitiesPage,
    ParentLearningActivitiesPage,
    AdminLearningActivitiesPage,
  ]) {
    const html = await renderElementToHtml(
      <MemoryRouter>
        <Provider store={store}>
          <PageComponent />
        </Provider>
      </MemoryRouter>,
    );
    assert(html.length > 50, 'Rendered portal HTML must not be empty');
  }
  results.push('✓ 4. Badges, API endpoint contracts, and SSR rendering pass for all 4 portals');

  return { passed: results.length, total: results.length, results };
}
