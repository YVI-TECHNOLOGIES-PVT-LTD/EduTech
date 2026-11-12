import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { store } from '@/app/store';
import { setCredentials, logout } from '@/shared/store/authSlice';
import { setPermissions, clearPermissions } from '@/shared/store/permissionSlice';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthContext, type AuthContextType } from '@/context/AuthContext';
import { MasterDataProvider } from '@/modules/admission/context/MasterDataContext';
import { WorkspaceProvider } from '@/modules/common/workspace/WorkspaceProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppRoutes, RoleBasedDefaultRedirect } from '@/app/router';
import { AppSidebar } from '@/components/shell/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ADMIN_NAVIGATION, getNavigationForUser, searchNavigationItems } from '@/config/navigation';
import { ROUTE_REGISTRY } from '@/config/route_registry';
import { parseBreadcrumbs } from '@/lib/breadcrumb';
import { LandingResolver } from '@/services/LandingResolver';
import type { EnrichedUser } from '@/types/auth';

export type HtmlRenderer = (element: React.ReactElement) => Promise<string>;

export interface AcademicRouteExpectation {
  navId: string;
  sidebarTitle: string;
  url: string;
  registryPath: string;
  testId: string;
  pageHeading: string;
  breadcrumbTitle: string;
  teacherAllowed?: boolean;
}

export const EXPECTED_ACADEMIC_ITEMS: AcademicRouteExpectation[] = [
  {
    navId: 'adm_acad_dash',
    sidebarTitle: 'Academic Overview',
    url: '/app/academic/dashboard',
    registryPath: 'academic/dashboard',
    testId: 'academic-overview-page',
    pageHeading: 'Academic Overview',
    breadcrumbTitle: 'Academic Overview',
  },
  {
    navId: 'adm_acad_structure',
    sidebarTitle: 'Years & Structure',
    url: '/app/academic/structure',
    registryPath: 'academic/structure',
    testId: 'academic-structure-page',
    pageHeading: 'Years & Structure',
    breadcrumbTitle: 'Years & Structure',
  },
  {
    navId: 'adm_acad_classes',
    sidebarTitle: 'Grades & Sections',
    url: '/app/academic/classes',
    registryPath: 'academic/classes',
    testId: 'academic-classes-page',
    pageHeading: 'Grades & Sections',
    breadcrumbTitle: 'Grades & Sections',
  },
  {
    navId: 'adm_acad_subjects',
    sidebarTitle: 'Subjects & Catalog',
    url: '/app/academic/subjects',
    registryPath: 'academic/subjects',
    testId: 'academic-subjects-page',
    pageHeading: 'Subjects & Catalog',
    breadcrumbTitle: 'Subjects & Catalog',
  },
  {
    navId: 'adm_acad_faculty',
    sidebarTitle: 'Faculty Scheduling & Workload',
    url: '/app/academic/faculty',
    registryPath: 'academic/faculty',
    testId: 'academic-faculty-page',
    pageHeading: 'Faculty Scheduling & Workload',
    breadcrumbTitle: 'Faculty Scheduling & Workload',
  },
  {
    navId: 'adm_acad_timetable',
    sidebarTitle: 'Timetable Master',
    url: '/app/academic/timetable',
    registryPath: 'academic/timetable',
    testId: 'academic-timetable-page',
    pageHeading: 'Timetable Master',
    breadcrumbTitle: 'Timetable Master',
  },
  {
    navId: 'adm_acad_calendar',
    sidebarTitle: 'Academic Calendar & Terms',
    url: '/app/academic/calendar',
    registryPath: 'academic/calendar',
    testId: 'academic-calendar-page',
    pageHeading: 'Academic Calendar & Terms',
    breadcrumbTitle: 'Academic Calendar & Terms',
  },
  {
    navId: 'adm_acad_curriculum',
    sidebarTitle: 'Curriculum & Syllabus',
    url: '/app/academic/curriculum',
    registryPath: 'academic/curriculum',
    testId: 'academic-curriculum-page',
    pageHeading: 'Curriculum & Syllabus',
    breadcrumbTitle: 'Curriculum & Syllabus',
  },
  {
    navId: 'adm_acad_lesson_planning',
    sidebarTitle: 'AI Lesson Planning',
    url: '/app/academic/lesson-planning',
    registryPath: 'academic/lesson-planning',
    testId: 'academic-lesson-planning-page',
    pageHeading: 'AI Lesson Planning',
    breadcrumbTitle: 'AI Lesson Planning',
    teacherAllowed: true,
  },
  {
    navId: 'adm_acad_resources',
    sidebarTitle: 'Digital Resource Library',
    url: '/app/academic/resources',
    registryPath: 'academic/resources',
    testId: 'academic-resources-page',
    pageHeading: 'Digital Resource Library',
    breadcrumbTitle: 'Digital Resource Library',
    teacherAllowed: true,
  },
  {
    navId: 'adm_acad_readiness',
    sidebarTitle: 'Readiness & Publishing',
    url: '/app/academic/readiness',
    registryPath: 'academic/readiness',
    testId: 'academic-readiness-page',
    pageHeading: 'Readiness & Publishing',
    breadcrumbTitle: 'Readiness & Publishing',
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

function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
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
    hasRole: (role: string) => {
      const target = LandingResolver.normalizeRole(role);
      return normalizedRoles.includes(target);
    },
    refreshProfile: async () => {},
    systemMode: 'UAT',
  };
}

function seedReduxSession(user: EnrichedUser): void {
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
  seedReduxSession(user);
  const authValue = createAuthValue(user);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { enabled: false, retry: false },
    },
  });

  const tree = (
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
    </ErrorBoundary>
  );

  const rawHtml = await renderHtml(tree);
  return decodeHtmlEntities(rawHtml);
}

function getActiveAcademicNavIds(html: string): string[] {
  const matches = html.matchAll(/data-nav-id="(adm_acad_[^"]+)"[^>]*data-active="true"/g);
  return Array.from(matches, (m) => m[1]);
}

function getAnyActiveNavIds(html: string): string[] {
  const matches = html.matchAll(/data-nav-id="([^"]+)"[^>]*data-active="true"/g);
  return Array.from(matches, (m) => m[1]);
}

export async function runAcademicNavigationTests(renderHtml: HtmlRenderer): Promise<{
  total: number;
  passed: number;
  results: string[];
}> {
  const results: string[] = [];
  const record = (name: string) => results.push(`PASS: ${name}`);

  // 1. Verify sidebar config for Academic Management
  const academicSection = ADMIN_NAVIGATION.flatMap((g) => g.items).find(
    (item) => item.id === 'adm_academic_group',
  );
  assert(academicSection, 'adm_academic_group must exist in ADMIN_NAVIGATION');
  assertEqual(
    academicSection.url,
    '#',
    'adm_academic_group parent must be a collapsible container (#) rather than overriding children',
  );
  const subItems = academicSection.items ?? academicSection.children ?? [];
  assertEqual(
    subItems.length,
    EXPECTED_ACADEMIC_ITEMS.length,
    'adm_academic_group must have all 11 academic submenus',
  );

  const navUrls = new Set<string>();
  for (let i = 0; i < EXPECTED_ACADEMIC_ITEMS.length; i++) {
    const expected = EXPECTED_ACADEMIC_ITEMS[i];
    const actual = subItems[i];
    assertEqual(actual.id, expected.navId, `Sidebar item index ${i} id mismatch`);
    assertEqual(
      actual.title,
      expected.sidebarTitle,
      `Sidebar item ${expected.navId} title mismatch`,
    );
    assertEqual(actual.url, expected.url, `Sidebar item ${expected.navId} url mismatch`);
    assert(!navUrls.has(actual.url), `Duplicate sidebar URL found: ${actual.url}`);
    assert(
      actual.url !== '/app/admin/dashboard',
      `${actual.id} must not point to /app/admin/dashboard`,
    );
    navUrls.add(actual.url);
  }
  record('Sidebar menu structure & 11 unique Academic Management destinations');

  // Search navigation excludes '#' container and finds Academic Overview
  const searchResults = searchNavigationItems(ADMIN_NAVIGATION, 'Academic');
  assert(
    !searchResults.some((item) => item.url === '#'),
    'searchNavigationItems must exclude "#" group containers',
  );
  assert(
    searchResults.some((item) => item.url === '/app/academic/dashboard'),
    'searchNavigationItems("Academic") must include /app/academic/dashboard',
  );
  record('Command/sidebar search excludes "#" group containers');

  // 2. Verify route registry uniqueness and registration completeness
  const academicRoutes = ROUTE_REGISTRY.filter(
    (r) => r.path === 'academic' || r.path.startsWith('academic/'),
  );
  const registryPathCounts = new Map<string, number>();
  for (const r of academicRoutes) {
    registryPathCounts.set(r.path, (registryPathCounts.get(r.path) || 0) + 1);
  }
  for (const [p, count] of registryPathCounts.entries()) {
    assertEqual(count, 1, `Duplicate academic route registration in ROUTE_REGISTRY: ${p}`);
  }
  for (const expected of EXPECTED_ACADEMIC_ITEMS) {
    assert(
      registryPathCounts.has(expected.registryPath),
      `Missing route registration for ${expected.registryPath}`,
    );
  }
  assert(registryPathCounts.has('academic'), 'Missing academic index route');
  assert(
    registryPathCounts.has('academic/curriculum/:id'),
    'Missing nested curriculum detail route',
  );
  assert(
    registryPathCounts.has('academic/readiness/:academicYearId'),
    'Missing nested readiness detail route',
  );
  record('ROUTE_REGISTRY registers all 11 academic routes + index + nested params uniquely');

  // Verify academic index route redirects to /app/academic/dashboard (not /app/admin/dashboard)
  const academicIndexRoute = ROUTE_REGISTRY.find((r) => r.path === 'academic');
  assert(
    React.isValidElement(academicIndexRoute?.element) &&
      (academicIndexRoute!.element.props as { to?: string }).to === '/app/academic/dashboard',
    'academic index route must redirect to /app/academic/dashboard',
  );
  record('Academic index route targets /app/academic/dashboard');

  // 3. Render every single Academic route through full <AppRoutes /> as ADMIN
  const adminUser = createMockUser(['ADMIN'], []);
  for (const item of EXPECTED_ACADEMIC_ITEMS) {
    const html = await renderAppAtRoute([item.url], adminUser, renderHtml);
    assert(
      html.includes(`data-testid="${item.testId}"`),
      `Route ${item.url} must render real component (${item.testId})`,
    );
    assert(
      html.includes(item.pageHeading),
      `Route ${item.url} must render heading "${item.pageHeading}"`,
    );
    assert(
      !html.includes('Test ADMIN Dashboard') && !html.includes('admin-dashboard'),
      `Route ${item.url} must not redirect to /app/admin/dashboard`,
    );

    // Sidebar expanded & exact single active highlight
    assert(
      html.includes('id="subnav-adm_academic_group"'),
      `Sidebar group adm_academic_group must stay expanded on ${item.url}`,
    );
    const activeAcademicIds = getActiveAcademicNavIds(html);
    assertEqual(
      activeAcademicIds.length,
      1,
      `Expected exactly 1 active Academic item on ${item.url}, got ${JSON.stringify(activeAcademicIds)}`,
    );
    assertEqual(activeAcademicIds[0], item.navId, `Wrong active sidebar item on ${item.url}`);
    assert(
      html.includes(`data-nav-id="${item.navId}"`) && html.includes('aria-current="page"'),
      `Active sidebar link for ${item.navId} must have aria-current="page"`,
    );

    // Breadcrumbs & page header in AppNavbar
    assert(
      html.includes('Academic Management') && html.includes('href="/app/academic/dashboard"'),
      `Navbar breadcrumb on ${item.url} must link Academic Management to /app/academic/dashboard`,
    );
    assert(
      html.includes(item.breadcrumbTitle),
      `Navbar must display breadcrumb title "${item.breadcrumbTitle}" on ${item.url}`,
    );

    const crumbs = parseBreadcrumbs(item.url);
    assert(
      crumbs.some((c) => c.label === 'Academic Management' && c.path === '/app/academic/dashboard'),
      `parseBreadcrumbs(${item.url}) must map Academic Management -> /app/academic/dashboard`,
    );
    assertEqual(
      crumbs[crumbs.length - 1]?.label,
      item.breadcrumbTitle,
      `parseBreadcrumbs(${item.url}) leaf title mismatch`,
    );
  }
  record(
    'All 11 Academic routes render real pages, sidebar active state, and breadcrumbs in <AppRoutes />',
  );

  // 4. Nested parameter routes (direct URL & refresh equivalence)
  const nestedRoutes = [
    {
      url: '/app/academic/curriculum/curr-2026-math',
      testId: 'academic-curriculum-page',
      navId: 'adm_acad_curriculum',
      heading: 'Curriculum & Syllabus',
    },
    {
      url: '/app/academic/readiness/ay-2026-27',
      testId: 'academic-readiness-page',
      navId: 'adm_acad_readiness',
      heading: 'Readiness & Publishing',
    },
  ];
  for (const nested of nestedRoutes) {
    const html = await renderAppAtRoute([nested.url], adminUser, renderHtml);
    assert(
      html.includes(`data-testid="${nested.testId}"`) && html.includes(nested.heading),
      `Nested route ${nested.url} failed to render ${nested.testId}`,
    );
    const activeIds = getActiveAcademicNavIds(html);
    assertEqual(
      activeIds[0],
      nested.navId,
      `Nested route ${nested.url} failed to highlight ${nested.navId}`,
    );
  }
  record('Nested academic parameter routes resolve parent sidebar highlighting and page rendering');

  // 5. Simulated back/forward history navigation sequence in MemoryRouter
  const historyEntries = ['/app/academic/structure', '/app/academic/classes'];
  const forwardHtml = await renderAppAtRoute(historyEntries, adminUser, renderHtml);
  assert(
    forwardHtml.includes('data-testid="academic-classes-page"'),
    'Forward history entry must render classes',
  );
  assertEqual(
    getActiveAcademicNavIds(forwardHtml)[0],
    'adm_acad_classes',
    'Forward history active nav mismatch',
  );

  const backHtml = await renderAppAtRoute(['/app/academic/structure'], adminUser, renderHtml);
  assert(
    backHtml.includes('data-testid="academic-structure-page"'),
    'Back history entry must render structure',
  );
  assertEqual(
    getActiveAcademicNavIds(backHtml)[0],
    'adm_acad_structure',
    'Back history active nav mismatch',
  );
  record('History navigation updates active sidebar state and page rendering');

  // 6. Collapsible group auto-expands even if localStorage previously persisted collapsed "[]"
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
    localStorage.setItem('edutrack_sidebar_expanded', JSON.stringify([]));
  }
  const forceExpandedSidebar = await renderAppAtRoute(
    ['/app/academic/timetable'],
    adminUser,
    renderHtml,
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>,
  );
  assert(
    forceExpandedSidebar.includes('id="subnav-adm_academic_group"'),
    'AppSidebar must auto-expand adm_academic_group when direct URL matches a child route',
  );
  assertEqual(
    getActiveAcademicNavIds(forceExpandedSidebar)[0],
    'adm_acad_timetable',
    'AppSidebar direct URL render must highlight timetable item',
  );
  record('Direct URL auto-expands Academic Management group and activates matching child');

  // 7. RBAC and Route Guard checks across all roles
  const superAdminUser = createMockUser(['SUPER_ADMIN'], []);
  const superAdminStructureHtml = await renderAppAtRoute(
    ['/app/academic/structure'],
    superAdminUser,
    renderHtml,
  );
  assert(
    superAdminStructureHtml.includes('data-testid="academic-structure-page"'),
    'SUPER_ADMIN must retain access to Academic Structure',
  );
  const superAdminDashHtml = await renderAppAtRoute(
    ['/app/super-admin/dashboard'],
    superAdminUser,
    renderHtml,
  );
  assert(
    superAdminDashHtml.includes('Super Admin') || superAdminDashHtml.includes('School Setup'),
    'SUPER_ADMIN dashboard must continue rendering cleanly',
  );
  record('SUPER_ADMIN access to Academic Management and Super Admin dashboard preserved');

  // Teacher & Faculty: allowed on resources & lesson-planning, blocked on Admin-only academic routes
  for (const teacherRole of ['TEACHER', 'FACULTY']) {
    const teacherUser = createMockUser([teacherRole], ['ACADEMIC_VIEW']);
    for (const item of EXPECTED_ACADEMIC_ITEMS) {
      const html = await renderAppAtRoute([item.url], teacherUser, renderHtml);
      if (item.teacherAllowed) {
        assert(
          html.includes(`data-testid="${item.testId}"`),
          `${teacherRole} must access shared route ${item.url}`,
        );
      } else {
        assert(
          !html.includes(`data-testid="${item.testId}"`),
          `${teacherRole} must be blocked from Admin-only route ${item.url}`,
        );
      }
    }
    const teacherDashHtml = await renderAppAtRoute(
      ['/app/teacher/dashboard'],
      teacherUser,
      renderHtml,
    );
    assert(
      teacherDashHtml.includes('Teacher Dashboard') ||
        teacherDashHtml.includes('Faculty Workspace'),
      `${teacherRole} dashboard must render cleanly`,
    );
  }
  record('TEACHER & FACULTY access limited to shared academic routes (lesson-planning/resources)');

  // Finance, Front Office, Student, Parent: blocked on ALL academic routes, portals unaffected
  const isolatedPortals: Array<{
    roles: string[];
    permissions: string[];
    expectedLanding: string;
    portalUrl: string;
    portalMarker: string;
  }> = [
    {
      roles: ['FINANCE'],
      permissions: ['fees.dashboard.view', 'fees.view'],
      expectedLanding: '/app/finance/dashboard',
      portalUrl: '/app/finance/dashboard',
      portalMarker: 'Finance Dashboard',
    },
    {
      roles: ['FRONT_OFFICE'],
      permissions: ['ADMISSION_VIEW'],
      expectedLanding: '/app/front-office/dashboard',
      portalUrl: '/app/front-office/dashboard',
      portalMarker: 'Front Office Operations',
    },
    {
      roles: ['STUDENT'],
      permissions: ['student.dashboard.view'],
      expectedLanding: '/app/student/dashboard',
      portalUrl: '/app/student/dashboard',
      portalMarker: 'Loading Academic Portal...',
    },
    {
      roles: ['PARENT', 'ENROLLED_PARENT'],
      permissions: [],
      expectedLanding: '/app/parent/dashboard',
      portalUrl: '/app/parent/dashboard',
      portalMarker: 'p_enrolled_dashboard',
    },
  ];

  for (const portal of isolatedPortals) {
    const portalUser = createMockUser(portal.roles, portal.permissions, {
      hasEnrolledStudent: portal.roles.includes('ENROLLED_PARENT'),
      isPostAdmission: portal.roles.includes('ENROLLED_PARENT'),
    });
    assertEqual(
      LandingResolver.resolveLandingRoute(portalUser.roles),
      portal.expectedLanding,
      `LandingResolver mismatch for ${portal.roles.join(',')}`,
    );

    const navGroups = getNavigationForUser(portal.roles, portal.roles.includes('ENROLLED_PARENT'));
    assert(
      !navGroups.some((g) => g.items.some((it) => it.id === 'adm_academic_group')),
      `${portal.roles.join(',')} navigation must not include Admin Academic Management group`,
    );

    // Block check on Admin & shared academic routes
    for (const blockedUrl of [
      '/app/academic/dashboard',
      '/app/academic/structure',
      '/app/academic/resources',
    ]) {
      const blockedHtml = await renderAppAtRoute([blockedUrl], portalUser, renderHtml);
      assert(
        !blockedHtml.includes('data-testid="academic-'),
        `${portal.roles.join(',')} must not render academic module at ${blockedUrl}`,
      );
    }

    // Own portal dashboard still renders cleanly
    const portalHtml = await renderAppAtRoute([portal.portalUrl], portalUser, renderHtml);
    assert(
      portalHtml.includes(portal.portalMarker),
      `Portal regression: ${portal.portalUrl} did not render "${portal.portalMarker}"`,
    );
    const activeIds = getAnyActiveNavIds(portalHtml);
    assert(
      !activeIds.some((id) => id.startsWith('adm_acad_')),
      `Portal ${portal.portalUrl} must not highlight academic nav items`,
    );
  }
  record(
    'FINANCE, FRONT_OFFICE, STUDENT, and PARENT blocked from academic routes and retain their own portals',
  );

  // LandingResolver non-interference check on unmatched route fallback
  assertEqual(
    LandingResolver.resolveLandingRoute(adminUser.roles),
    '/app/admin/dashboard',
    'ADMIN login landing must resolve to /app/admin/dashboard',
  );
  const hOiUser = createMockUser(['HEAD_OF_INSTITUTE'], []);
  assertEqual(
    LandingResolver.resolveLandingRoute(hOiUser.roles),
    '/app/admin/dashboard',
    'HEAD_OF_INSTITUTE login landing must resolve to /app/admin/dashboard',
  );
  assert(
    typeof RoleBasedDefaultRedirect === 'function',
    'RoleBasedDefaultRedirect remains exported for fallback routes only',
  );
  record(
    'LandingResolver resolves canonical login portals without interfering in valid route matches',
  );

  // HR & cross-role fallback safety (never render 403 Unauthorized on default or cross-role landing)
  const hrUser = createMockUser(['HR'], []);
  assertEqual(
    LandingResolver.resolveLandingRoute(hrUser.roles),
    '/app/profile',
    'HR landing must resolve to /app/profile',
  );
  const hrProfileHtml = await renderAppAtRoute(['/app/profile'], hrUser, renderHtml);
  assert(
    !hrProfileHtml.includes('403') && !hrProfileHtml.includes('Unauthorized Access'),
    'HR profile landing must not hit 403 Unauthorized Access',
  );

  // Verify cross-role guards redirect away from mismatching personas without landing on Unauthorized page
  for (const [probeRoute, probeUser] of [
    ['/app/super-admin/dashboard', adminUser],
    ['/app/teacher/dashboard', createMockUser(['PARENT'], [])],
    ['/app/parent/dashboard', createMockUser(['TEACHER'], [])],
    ['/app/parent/dashboard', hrUser],
  ] as const) {
    const html = await renderAppAtRoute([probeRoute], probeUser, renderHtml);
    assert(
      !html.includes('Unauthorized Access'),
      `Cross-role guard at ${probeRoute} for ${probeUser.roles.join(',')} must not render Unauthorized Access`,
    );
  }
  record('HR default landing and cross-role route guards avoid 403 Unauthorized Access');

  return {
    total: results.length,
    passed: results.length,
    results,
  };
}
