import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from '@/app/store';
import { setCredentials, logout } from '@/shared/store/authSlice';
import { setPermissions, clearPermissions } from '@/shared/store/permissionSlice';
import { setSelectedChildId } from '@/shared/store/parentPortalSlice';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthContext, type AuthContextType } from '@/context/AuthContext';
import { MasterDataProvider } from '@/modules/admission/context/MasterDataContext';
import { WorkspaceProvider } from '@/modules/common/workspace/WorkspaceProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppRoutes } from '@/app/router';
import { AppSidebar } from '@/components/shell/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { POST_ADMISSION_PARENT_NAVIGATION, getNavigationForUser } from '@/config/navigation';
import { ROUTE_REGISTRY } from '@/config/route_registry';
import { parseBreadcrumbs } from '@/lib/breadcrumb';
import { LandingResolver } from '@/services/LandingResolver';
import type { EnrichedUser } from '@/types/auth';

export type HtmlRenderer = (element: React.ReactElement) => Promise<string>;

interface ExpectedParentRoute {
  groupTitle: string;
  navId: string;
  title: string;
  url: string;
  registryPath: string;
  testId?: string;
}

const EXPECTED_PARENT_NAV: ExpectedParentRoute[] = [
  {
    groupTitle: 'MAIN MENU',
    navId: 'p_enrolled_dashboard',
    title: 'Dashboard',
    url: '/app/parent/dashboard',
    registryPath: 'parent/dashboard',
  },
  {
    groupTitle: 'MAIN MENU',
    navId: 'parent_children',
    title: 'My Children',
    url: '/app/parent/children',
    registryPath: 'parent/children',
    testId: 'parent-children-page',
  },
  {
    groupTitle: 'MAIN MENU',
    navId: 'parent_timetable',
    title: 'Timetable',
    url: '/app/parent/timetable',
    registryPath: 'parent/timetable',
    testId: 'parent-timetable-page',
  },
  {
    groupTitle: 'MAIN MENU',
    navId: 'parent_academic_progress',
    title: 'Academic Progress',
    url: '/app/parent/academic-progress',
    registryPath: 'parent/academic-progress',
    testId: 'parent-academic-progress-page',
  },
  {
    groupTitle: 'MAIN MENU',
    navId: 'parent_subjects',
    title: 'Subjects & Curriculum',
    url: '/app/parent/subjects',
    registryPath: 'parent/subjects',
    testId: 'parent-subjects-page',
  },
  {
    groupTitle: 'MAIN MENU',
    navId: 'parent_learning_resources',
    title: 'Learning Resources',
    url: '/app/parent/learning-resources',
    registryPath: 'parent/learning-resources',
    testId: 'parent-learning-resources-page',
  },
  {
    groupTitle: 'MAIN MENU',
    navId: 'parent_academic_calendar',
    title: 'Academic Calendar',
    url: '/app/parent/academic-calendar',
    registryPath: 'parent/academic-calendar',
    testId: 'parent-academic-calendar-page',
  },
  {
    groupTitle: 'STUDENT INFORMATION',
    navId: 'parent_documents',
    title: 'Documents Centre',
    url: '/app/parent/documents',
    registryPath: 'parent/documents',
  },
  {
    groupTitle: 'STUDENT INFORMATION',
    navId: 'parent_notifications',
    title: 'Notifications',
    url: '/app/parent/notifications',
    registryPath: 'parent/notifications',
    testId: 'parent-notifications-page',
  },
  {
    groupTitle: 'STUDENT INFORMATION',
    navId: 'parent_communication',
    title: 'Communication',
    url: '/app/parent/communication',
    registryPath: 'parent/communication',
    testId: 'parent-communication-page',
  },
  {
    groupTitle: 'FINANCE & ADMISSIONS',
    navId: 'parent_fees',
    title: 'Fees & Payments',
    url: '/app/fees/my',
    registryPath: 'fees/my',
  },
  {
    groupTitle: 'FINANCE & ADMISSIONS',
    navId: 'parent_admissions',
    title: 'Admissions Desk',
    url: '/app/admissions/my',
    registryPath: 'admissions/my',
  },
  {
    groupTitle: 'ACCOUNT',
    navId: 'parent_profile',
    title: 'My Profile',
    url: '/app/parent/profile',
    registryPath: 'parent/profile',
  },
  {
    groupTitle: 'ACCOUNT',
    navId: 'parent_settings',
    title: 'Settings',
    url: '/app/parent/settings',
    registryPath: 'parent/settings',
    testId: 'parent-settings-page',
  },
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(
      `${message} (expected=${JSON.stringify(expected)}, actual=${JSON.stringify(actual)})`,
    );
  }
}

function createMockUser(
  roles: string[],
  permissions: string[],
  overrides: Partial<EnrichedUser> = {},
): EnrichedUser {
  return {
    id: `user-${roles[0]?.toLowerCase() || 'test'}`,
    email: `${roles[0]?.toLowerCase() || 'test'}@edutrack.local`,
    school_id: 'school-1',
    roles,
    permissions,
    full_name: `Test ${roles[0] || 'User'}`,
    login_status: 'APPROVED',
    enabledFeatures: {
      dashboard: true,
      finance: true,
      entrance_exam: true,
      hostel: true,
    },
    ...overrides,
  };
}

function createAuthValue(user: EnrichedUser): AuthContextType {
  const normalizedRoles = user.roles.map((r) => LandingResolver.normalizeRole(r));
  const isAdmin = normalizedRoles.some((r) =>
    [
      'SUPER_ADMIN',
      'SUPERADMIN',
      'ADMIN',
      'ORG_ADMIN',
      'HOI',
      'PRINCIPAL',
      'HEAD_OF_INSTITUTE',
    ].includes(r),
  );
  return {
    session: null,
    user,
    accessToken: 'test-token',
    loading: false,
    boundaryState: 'stable',
    isAuthenticated: true,
    signOut: async () => {},
    hasPermission: (code: string) => isAdmin || user.permissions.includes(code),
    hasRole: (role: string) => normalizedRoles.includes(LandingResolver.normalizeRole(role)),
    refreshProfile: async () => {},
    systemMode: 'UAT',
  };
}

async function renderAppAtRoute(
  initialEntries: string[],
  user: EnrichedUser,
  renderHtml: HtmlRenderer,
  node?: React.ReactNode,
): Promise<string> {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
  store.dispatch(logout());
  store.dispatch(clearPermissions());
  store.dispatch(
    setCredentials({
      user,
      accessToken: 'test-token',
      refreshToken: null,
      systemMode: 'UAT',
    }),
  );
  store.dispatch(
    setPermissions({
      roles: user.roles,
      permissions: user.permissions,
    }),
  );

  const authValue = createAuthValue(user);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { enabled: false, retry: false } },
  });

  return renderHtml(
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <LanguageProvider>
          <Provider store={store}>
            <QueryClientProvider client={queryClient}>
              <AuthContext.Provider value={authValue}>
                <MasterDataProvider>
                  <WorkspaceProvider>
                    <TooltipProvider delay={0}>
                      <MemoryRouter initialEntries={initialEntries}>
                        {node ?? <AppRoutes />}
                      </MemoryRouter>
                    </TooltipProvider>
                  </WorkspaceProvider>
                </MasterDataProvider>
              </AuthContext.Provider>
            </QueryClientProvider>
          </Provider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>,
  );
}

export async function runParentNavigationTests(renderHtml: HtmlRenderer): Promise<{
  total: number;
  passed: number;
  results: string[];
}> {
  const results: string[] = [];
  const record = (msg: string) => results.push(`PASS: ${msg}`);

  // 1. Validate POST_ADMISSION_PARENT_NAVIGATION architecture & uniqueness
  assertEqual(
    POST_ADMISSION_PARENT_NAVIGATION.length,
    4,
    'Parent sidebar must have 4 logical groups',
  );
  assertEqual(POST_ADMISSION_PARENT_NAVIGATION[0].title, 'MAIN MENU', 'Group 1 must be MAIN MENU');
  assertEqual(
    POST_ADMISSION_PARENT_NAVIGATION[1].title,
    'STUDENT INFORMATION',
    'Group 2 must be STUDENT INFORMATION',
  );
  assertEqual(
    POST_ADMISSION_PARENT_NAVIGATION[2].title,
    'FINANCE & ADMISSIONS',
    'Group 3 must preserve Finance & Admissions',
  );
  assertEqual(POST_ADMISSION_PARENT_NAVIGATION[3].title, 'ACCOUNT', 'Group 4 must be ACCOUNT');

  const actualNavItems = POST_ADMISSION_PARENT_NAVIGATION.flatMap((g) =>
    g.items.map((it) => ({ group: g.title, id: it.id, title: it.title, url: it.url })),
  );
  assertEqual(
    actualNavItems.length,
    EXPECTED_PARENT_NAV.length,
    'Parent sidebar item count mismatch',
  );

  const seenUrls = new Set<string>();
  for (let i = 0; i < EXPECTED_PARENT_NAV.length; i++) {
    const exp = EXPECTED_PARENT_NAV[i];
    const act = actualNavItems[i];
    assertEqual(act.group, exp.groupTitle, `Group mismatch for ${exp.url}`);
    assertEqual(act.id, exp.navId, `Nav id mismatch for ${exp.url}`);
    assertEqual(act.title, exp.title, `Title mismatch for ${exp.url}`);
    assertEqual(act.url, exp.url, `URL mismatch for ${exp.navId}`);
    assert(!seenUrls.has(act.url), `Duplicate sidebar URL detected: ${act.url}`);
    assert(act.url !== '#', `Placeholder "#" route disallowed in Parent sidebar: ${act.id}`);
    seenUrls.add(act.url);
  }
  record(
    'Parent Portal sidebar contains all 14 structured menu destinations with preserved Finance',
  );

  // 2. Validate ROUTE_REGISTRY uniqueness & parent guard enforcement
  const pathCounts = new Map<string, number>();
  for (const r of ROUTE_REGISTRY) {
    pathCounts.set(r.path, (pathCounts.get(r.path) || 0) + 1);
  }
  for (const exp of EXPECTED_PARENT_NAV) {
    assertEqual(
      pathCounts.get(exp.registryPath),
      1,
      `Route ${exp.registryPath} must be registered once in ROUTE_REGISTRY`,
    );
    const routeDef = ROUTE_REGISTRY.find((r) => r.path === exp.registryPath);
    assert(routeDef, `Missing ROUTE_REGISTRY entry for ${exp.registryPath}`);
    assertEqual(
      routeDef.guardType,
      'parent',
      `Route ${exp.registryPath} must enforce guardType="parent"`,
    );
  }
  record('All Parent Portal & preserved routes registered uniquely with parent guardType');

  // 3. Verify Redux child selector slice clears cleanly on logout
  store.dispatch(setSelectedChildId('child-123'));
  assertEqual(
    store.getState().parentPortal.selectedChildId,
    'child-123',
    'Selected child must persist in Redux',
  );
  store.dispatch(logout());
  assertEqual(
    store.getState().parentPortal.selectedChildId,
    null,
    'Selected child must clear on logout',
  );
  record('Redux parentPortalSlice tracks active child and clears on logout');

  // 4. Verify Parent Sidebar active item highlighting & breadcrumbs across all Parent URLs
  const parentUser = createMockUser(['PARENT', 'ENROLLED_PARENT'], [], {
    hasEnrolledStudent: true,
    isPostAdmission: true,
  });

  const navForParent = getNavigationForUser(parentUser.roles, true);
  assert(
    navForParent.some((g) => g.title === 'MAIN MENU') &&
      navForParent.some((g) => g.title === 'STUDENT INFORMATION') &&
      navForParent.some((g) => g.title === 'ACCOUNT'),
    'getNavigationForUser(PARENT, true) must resolve Parent Portal navigation groups',
  );

  for (const item of EXPECTED_PARENT_NAV) {
    const sidebarHtml = await renderAppAtRoute(
      [item.url],
      parentUser,
      renderHtml,
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>,
    );
    const activeMatches = Array.from(
      sidebarHtml.matchAll(/data-nav-id="([^"]+)"[^>]*data-active="true"/g),
      (m) => m[1],
    );
    assertEqual(
      activeMatches.length,
      1,
      `Expected single active sidebar link on ${item.url}, got ${JSON.stringify(activeMatches)}`,
    );
    assertEqual(activeMatches[0], item.navId, `Wrong active sidebar link on ${item.url}`);
    assert(
      sidebarHtml.includes('aria-current="page"'),
      `Missing aria-current="page" on active link for ${item.url}`,
    );

    const crumbs = parseBreadcrumbs(item.url);
    assert(crumbs.length >= 2, `Expected non-empty breadcrumbs for ${item.url}`);
  }
  record('All 14 Parent Portal URLs activate exact sidebar link and valid breadcrumbs');

  // 5. Render direct URL routes in full <AppRoutes /> and assert real page components + Parent guard segregation
  const renderedParentPages = EXPECTED_PARENT_NAV.filter((i) => i.testId);
  for (const item of renderedParentPages) {
    const html = await renderAppAtRoute([item.url], parentUser, renderHtml);
    assert(
      html.includes(`data-testid="${item.testId}"`),
      `Route ${item.url} must render ${item.testId} for enrolled parent`,
    );
  }
  record('Direct URL rendering mounts real Stage-2 Parent Portal components via <AppRoutes />');

  // 6. Role segregation: Admin, Teacher, Student, Finance blocked from Parent Academic routes
  for (const nonParentRoles of [['ADMIN'], ['TEACHER'], ['STUDENT'], ['FINANCE']]) {
    const intruder = createMockUser(nonParentRoles, ['ACADEMIC_VIEW', 'fees.view'], {
      hasEnrolledStudent: false,
      isPostAdmission: false,
    });
    for (const url of [
      '/app/parent/children',
      '/app/parent/timetable',
      '/app/parent/academic-progress',
      '/app/parent/subjects',
      '/app/parent/learning-resources',
      '/app/parent/academic-calendar',
      '/app/parent/settings',
    ]) {
      const blockedHtml = await renderAppAtRoute([url], intruder, renderHtml);
      assert(
        !blockedHtml.includes('data-testid="parent-'),
        `Role ${nonParentRoles.join(',')} must not render Parent Portal component on ${url}`,
      );
    }
  }
  record('Non-parent roles (ADMIN, TEACHER, STUDENT, FINANCE) blocked from Parent Portal routes');

  return {
    total: results.length,
    passed: results.length,
    results,
  };
}
