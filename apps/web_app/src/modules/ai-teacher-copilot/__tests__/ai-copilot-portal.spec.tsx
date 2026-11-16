import React from 'react';
import { getNavigationForUser } from '@/config/navigation';
import { ROUTE_REGISTRY } from '@/config/route_registry';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { aiCopilotApi } from '@/shared/api/aiCopilot.api';
import { TeacherAiCopilotPage } from '../pages/TeacherAiCopilotPage';
import { StudentStudyAssistantPage } from '../pages/StudentStudyAssistantPage';
import { AdminAiOversightPage } from '../pages/AdminAiOversightPage';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runAiCopilotPortalFrontendTests(
  renderElementToHtml: (el: React.ReactElement) => Promise<string>,
): Promise<{ passed: number; total: number; results: string[] }> {
  const results: string[] = [];

  // 1. Route registry & guard enforcement
  const routeMap = new Map(ROUTE_REGISTRY.map((r) => [r.path, r]));
  assert(
    routeMap.get('teacher/ai-copilot')?.guardType === 'teacher',
    'teacher/ai-copilot must require teacher guard',
  );
  assert(
    routeMap.get('admin/ai-oversight')?.guardType === 'admin' &&
      routeMap.get('admin/ai-oversight')?.permission === 'admin.dashboard.view',
    'admin/ai-oversight must require admin guard & admin.dashboard.view permission',
  );
  assert(
    routeMap.get('student/ai-study-assistant')?.permission === 'student.dashboard.view',
    'student/ai-study-assistant must require student.dashboard.view permission',
  );
  results.push('✓ 1. ROUTE_REGISTRY enforces Teacher, Admin, and Student guards for AI Copilot');

  // 2. Navigation items
  const teacherNav = getNavigationForUser(['TEACHER']);
  const flatTeacherUrls = teacherNav.flatMap((g) => g.items.map((i) => i.url));
  assert(
    flatTeacherUrls.includes('/app/teacher/ai-copilot'),
    'Teacher navigation must include /app/teacher/ai-copilot',
  );

  const studentNav = getNavigationForUser(['STUDENT']);
  const flatStudentUrls = studentNav.flatMap((g) => g.items.map((i) => i.url));
  assert(
    flatStudentUrls.includes('/app/student/ai-study-assistant'),
    'Student navigation must include /app/student/ai-study-assistant',
  );

  const adminNav = getNavigationForUser(['ADMIN']);
  const flatAdminUrls = adminNav.flatMap((g) => g.items.map((i) => i.url));
  assert(
    flatAdminUrls.includes('/app/admin/ai-oversight'),
    'Admin navigation must include /app/admin/ai-oversight',
  );
  results.push('✓ 2. Role-scoped sidebar navigation exposes all 3 AI Copilot routes');

  // 3. API Endpoints definition
  assert(
    ENDPOINTS.AI_COPILOT.STATUS === '/v1/ai-teacher-copilot/status',
    'Status endpoint must match API contract',
  );
  assert(
    ENDPOINTS.AI_COPILOT.TEACHER_CONTEXT === '/v1/ai-teacher-copilot/teacher/context',
    'Teacher context endpoint must match API contract',
  );
  assert(
    ENDPOINTS.AI_COPILOT.LESSON_PLANS_GENERATE ===
      '/v1/ai-teacher-copilot/teacher/lesson-plans/generate',
    'Lesson plans endpoint must match API contract',
  );
  assert(
    ENDPOINTS.AI_COPILOT.MATERIALS_APPROVE === '/v1/ai-teacher-copilot/teacher/materials/approve',
    'Materials approval endpoint must match API contract',
  );
  assert(
    ENDPOINTS.AI_COPILOT.STUDENT_STUDY_ASSISTANT ===
      '/v1/ai-teacher-copilot/student/study-assistant/respond',
    'Student study assistant endpoint must match API contract',
  );
  assert(
    ENDPOINTS.AI_COPILOT.ADMIN_USAGE === '/v1/ai-teacher-copilot/admin/usage',
    'Admin usage endpoint must match API contract',
  );
  assert(
    typeof aiCopilotApi.endpoints.generateLessonPlan === 'object' &&
      typeof aiCopilotApi.endpoints.approveMaterial === 'object' &&
      typeof aiCopilotApi.endpoints.respondStudentStudyAssistant === 'object' &&
      typeof aiCopilotApi.endpoints.getAdminAiUsage === 'object',
    'aiCopilotApi endpoints must be fully registered in RTK Query',
  );
  results.push('✓ 3. RTK Query AI Copilot endpoints and contract definitions verified');

  return { passed: results.length, total: results.length, results };
}
