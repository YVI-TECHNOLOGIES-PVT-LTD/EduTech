import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Sparkles, ChevronDown, User, LogOut, Settings, Building, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { LandingResolver } from '@/services/LandingResolver';
import { ParentDashboardService } from '@/modules/dashboard/services/ParentDashboardService';
import { getNavigationForUser, NavigationGroup, NavigationItem } from '@/config/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';
import { SidebarSkeleton } from '@/components/shell/NavSkeleton';

interface AppSidebarProps {
  className?: string;
}

const EXPANDED_STORAGE_KEY = 'edutrack.sidebar.expanded';

/**
 * Normalizes a URL path for consistent comparison:
 * - strips trailing slashes (except root '/')
 * - strips query string if present
 */
export function normalizeNavPath(url: string): string {
  if (!url) return '';
  const pathOnly = url.split('?')[0];
  const cleaned = pathOnly.replace(/\/+$/, '');
  return cleaned === '' ? '/' : cleaned;
}

/**
 * Finds the single best matching leaf item across the entire navigation tree.
 * Priority:
 * 1. Exact match with path + query params (Score: 1000 + url.length)
 * 2. Exact match with normalized path (Score: 500 + path.length)
 * 3. Deepest/longest prefix match for detail sub-routes (Score: 100 + path.length)
 *
 * Guaranteed invariants:
 * - Only 1 leaf destination can win.
 * - Non-prefix base routes (/app/people, /app/admissions, dashboards, etc.) NEVER prefix-match child sibling destinations.
 * - Sibling peer routes (like /app/people and /app/people/students) never collide.
 */
export function findActiveLeafItemId(
  items: NavigationItem[],
  currentPath: string,
  currentSearch: string = '',
): string | null {
  const normCurrentPath = normalizeNavPath(currentPath);
  const fullCurrentUrl = normCurrentPath + (currentSearch || '');

  // Flatten all reachable items in the tree
  const flattenNavItems = (list: NavigationItem[]): NavigationItem[] => {
    const flat: NavigationItem[] = [];
    for (const item of list) {
      if (item.url && item.url !== '#') {
        flat.push(item);
      }
      const children = item.items || item.children;
      if (children && children.length > 0) {
        flat.push(...flattenNavItems(children));
      }
    }
    return flat;
  };

  const allItems = flattenNavItems(items);
  let bestScore = -1;
  let bestItem: NavigationItem | null = null;

  const nonPrefixRoots = new Set([
    '/',
    '/app',
    '/app/dashboard',
    '/app/admin/dashboard',
    '/app/front-office/dashboard',
    '/app/parent/dashboard',
    '/app/teacher/dashboard',
    '/app/student/dashboard',
    '/app/super-admin/dashboard',
    '/app/finance/dashboard',
    '/app/academic/dashboard',
    '/app/faculty/dashboard',
    '/app/workspace',
    '/app/admissions',
    '/app/people',
    '/app/profile',
    '/app/settings',
  ]);

  for (const item of allItems) {
    if (!item.url || item.url === '#') continue;

    const itemNormPath = normalizeNavPath(item.url);
    const hasChildren = Boolean((item.items || item.children)?.length);

    // 1. Exact match with query params
    if (item.url.includes('?')) {
      if (item.url === fullCurrentUrl) {
        const score = 1000 + item.url.length;
        if (score > bestScore) {
          bestScore = score;
          bestItem = item;
        }
        continue;
      }
    }

    // 2. Exact match with path
    if (itemNormPath === normCurrentPath) {
      // Leaf items preferred over container items on exact match
      const score = (hasChildren ? 400 : 500) + itemNormPath.length;
      if (score > bestScore) {
        bestScore = score;
        bestItem = item;
      }
      continue;
    }

    // 3. Prefix match for detail routes (e.g. /app/people/students/123 -> /app/people/students)
    // Non-prefix roots and containers with children cannot prefix-match
    if (!nonPrefixRoots.has(itemNormPath) && !hasChildren) {
      if (normCurrentPath.startsWith(itemNormPath + '/')) {
        const score = 100 + itemNormPath.length;
        if (score > bestScore) {
          bestScore = score;
          bestItem = item;
        }
      }
    }
  }

  return bestItem ? bestItem.id : null;
}

/**
 * Check if a path matches an item's url directly or with query params
 */
export function isItemDirectlyActive(
  item: NavigationItem,
  currentPath: string,
  currentSearch: string = '',
  activeLeafId?: string | null,
): boolean {
  if (activeLeafId !== undefined) {
    return item.id === activeLeafId;
  }
  if (!item.url || item.url === '#') return false;
  const normCurrentPath = normalizeNavPath(currentPath);
  const normItemPath = normalizeNavPath(item.url);
  if (item.url.includes('?')) {
    return item.url === normCurrentPath + (currentSearch || '');
  }
  return normItemPath === normCurrentPath;
}

/**
 * Recursively check if an item or any of its descendants is active
 */
function isItemOrDescendantActive(item: NavigationItem, activeLeafId: string | null): boolean {
  if (!activeLeafId) return false;
  if (item.id === activeLeafId) return true;
  const children = item.items || item.children;
  if (children && children.length > 0) {
    return children.some((child) => isItemOrDescendantActive(child, activeLeafId));
  }
  return false;
}

/**
 * Collect all ancestor IDs for an active item based on active leaf ID or URL
 */
export function findActiveAncestorIds(
  items: NavigationItem[],
  target: string | null,
  currentSearch: string = '',
  ancestors: string[] = [],
): string[] {
  if (!target) return [];

  let leafId = target;
  if (target.startsWith('/')) {
    const resolved = findActiveLeafItemId(items, target, currentSearch);
    if (!resolved) return [];
    leafId = resolved;
  }

  let activeIds: string[] = [];

  for (const item of items) {
    const children = item.items || item.children;
    if (item.id === leafId) {
      activeIds = activeIds.concat(ancestors);
    }

    if (children && children.length > 0) {
      const childActiveIds = findActiveAncestorIds(children, leafId, currentSearch, [
        ...ancestors,
        item.id,
      ]);
      if (childActiveIds.length > 0) {
        activeIds = activeIds.concat(childActiveIds);
        activeIds.push(item.id);
      }
    }
  }

  return Array.from(new Set(activeIds));
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ className }) => {
  const { t } = useLanguage();
  const { user, signOut, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleLinkClick = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  const rawRoles: string[] =
    Array.isArray(user?.roles) && user.roles.length > 0
      ? user.roles
      : (user as any)?.role
        ? [(user as any).role]
        : [];
  const normalizedRoles = rawRoles.map((r: string) => LandingResolver.normalizeRole(r));
  const isPostAdmission = Boolean(
    (user as any)?.hasEnrolledStudent ||
    (user as any)?.isPostAdmission ||
    normalizedRoles.includes('ENROLLED_PARENT'),
  );
  const isParent = normalizedRoles.some((r: string) =>
    ['PARENT', 'GUARDIAN', 'ENROLLED_PARENT'].includes(r),
  );
  const [sidebarPostAdmission, setSidebarPostAdmission] = useState<boolean>(false);

  useEffect(() => {
    if (isPostAdmission || !isParent) return;
    let isMounted = true;
    ParentDashboardService.getOverview()
      .then((data) => {
        if (!isMounted) return;
        const kids = data?.children;
        if (Array.isArray(kids) && kids.length > 0) {
          setSidebarPostAdmission(true);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [user?.id, isParent, isPostAdmission]);

  const effectivePostAdmission = isPostAdmission || sidebarPostAdmission;
  const rolesKey = normalizedRoles.join(',');
  const navGroups = useMemo(
    () => getNavigationForUser(normalizedRoles, effectivePostAdmission),
    [rolesKey, effectivePostAdmission],
  );
  const currentPath = location.pathname;

  const allNavItems = useMemo(() => navGroups.flatMap((g) => g.items), [navGroups]);
  const activeLeafId = useMemo(
    () => findActiveLeafItemId(allNavItems, currentPath, location.search),
    [allNavItems, currentPath, location.search],
  );

  const homeUrl = LandingResolver.resolveLandingRoute(normalizedRoles, [], user);
  const contextLabel = navGroups[0]?.contextLabel || 'EDUTRACK ERP';

  // Expanded state loaded from localStorage, pre-seeded with ancestors of the active URL
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>(['fo_admissions']);
    try {
      const stored = localStorage.getItem(EXPANDED_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          initial.clear();
          for (const id of parsed) initial.add(id);
        }
      }
    } catch {}
    const activeAncestors = findActiveAncestorIds(allNavItems, activeLeafId);
    for (const id of activeAncestors) initial.add(id);
    return initial;
  });

  // Auto-expand all ancestors of the currently active route
  useEffect(() => {
    const activeAncestors = findActiveAncestorIds(allNavItems, activeLeafId);

    if (activeAncestors.length > 0) {
      setExpandedIds((prev) => {
        let changed = false;
        const next = new Set(prev);
        for (const id of activeAncestors) {
          if (!next.has(id)) {
            next.add(id);
            changed = true;
          }
        }
        if (changed) {
          try {
            localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(Array.from(next)));
          } catch {}
          return next;
        }
        return prev;
      });
    }
  }, [activeLeafId, allNavItems]);

  // Toggle item expansion
  const toggleExpanded = useCallback((id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }, []);

  const rawName =
    user?.full_name ||
    (user as any)?.name ||
    ((user as any)?.firstName
      ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim()
      : '');
  const displayName =
    rawName ||
    (user?.email
      ? user.email
          .split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase())
      : 'EduTrack User');

  // Prevent layout shift during genuine initial authentication / navigation tree resolution
  if (loading && !user) {
    return <SidebarSkeleton className={className} />;
  }

  const getNavTitle = (item: { id?: string; title: string }) => {
    const idMap: Record<string, string> = {
      p_dashboard: 'common.dashboard',
      p_my: 'navigation.myApplications',
      p_wizard: 'navigation.applicationWizard',
      p_docs: 'navigation.documentCenter',
      p_fees: 'navigation.paymentHistory',
      fo_dashboard: 'common.dashboard',
      fo_command: 'navigation.commandCenter',
      fo_enquiries: 'navigation.inquiries',
      fo_counselling: 'navigation.counselling',
      fo_applications: 'navigation.applicationsQueue',
      fo_verification: 'navigation.documentVerification',
      fo_fees: 'navigation.feeCollection',
      fo_visits: 'navigation.interviews',
      fo_exams: 'navigation.entranceExams',
      fo_decisions: 'navigation.admissionDecisions',
      fo_helpdesk: 'navigation.helpdesk',
      adm_helpdesk: 'navigation.helpdesk',
      fin_helpdesk: 'navigation.helpdesk',
      gen_helpdesk: 'navigation.helpdesk',
      admin_overview: 'navigation.overview',
      admin_school: 'navigation.schoolSetup',
      admin_staff: 'navigation.staffManagement',
      admin_roles: 'navigation.rolePermissions',
    };

    if (item.id && idMap[item.id]) {
      return t(idMap[item.id], item.title);
    }
    return item.title;
  };

  /**
   * Recursive tree item renderer
   */
  const renderNavigationItem = (item: NavigationItem, depth: number = 0) => {
    const children = item.items || item.children;
    const hasChildren = Boolean(children && children.length > 0);
    const isExpanded = expandedIds.has(item.id);
    const isDirectActive = item.id === activeLeafId;
    const isSubActive = isItemOrDescendantActive(item, activeLeafId);
    const Icon = item.icon || Building;
    const itemTitle = getNavTitle(item);

    // If item has children, render expandable parent node
    if (hasChildren) {
      const parentNode = (
        <div
          className={`group relative w-full flex items-center justify-between rounded-[10px] transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-1 ring-offset-sidebar ${
            depth === 0
              ? 'px-3 py-2 text-xs font-semibold min-h-[38px]'
              : 'px-2.5 py-1.5 text-[11px] font-medium min-h-[32px]'
          } ${
            isDirectActive
              ? 'bg-primary/10 text-primary font-bold shadow-2xs dark:bg-primary/20 dark:text-primary-foreground'
              : isSubActive
                ? 'bg-sidebar-accent/60 text-sidebar-foreground font-semibold border-s-2 border-primary/60'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground hover:translate-x-0.5'
          }`}
        >
          {/* Left Action: Navigate or Toggle */}
          <Link
            to={item.url}
            data-nav-id={item.id}
            data-active={isDirectActive ? 'true' : 'false'}
            aria-current={isDirectActive ? 'page' : undefined}
            onClick={(e) => {
              if (!item.url || item.url === '#') {
                e.preventDefault();
                toggleExpanded(item.id);
              } else {
                handleLinkClick();
              }
            }}
            className="flex-1 flex items-center gap-2.5 min-w-0 group-data-[collapsible=icon]:justify-center cursor-pointer focus-visible:outline-none"
          >
            <Icon
              className={`shrink-0 w-4 h-4 transition-transform duration-200 group-hover:scale-105 ${
                isDirectActive
                  ? 'text-primary'
                  : isSubActive
                    ? 'text-primary'
                    : 'text-sidebar-foreground/70 group-hover:text-sidebar-foreground'
              }`}
            />
            {!isCollapsed && <span className="truncate">{itemTitle}</span>}
          </Link>

          {/* Badge if present */}
          {!isCollapsed && item.badge && (
            <span className="ms-auto me-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
              {item.badge}
            </span>
          )}

          {/* Right Action: Expand/Collapse Chevron Button */}
          {!isCollapsed && (
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={`subnav-${item.id}`}
              aria-label={`Toggle ${itemTitle}`}
              onClick={(e) => toggleExpanded(item.id, e)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpanded(item.id, e);
                }
              }}
              className={`p-1 rounded-lg hover:bg-sidebar-border/40 transition-colors cursor-pointer shrink-0 ms-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                isDirectActive ? 'text-primary' : 'text-sidebar-foreground/60'
              }`}
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isExpanded ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>
          )}
        </div>
      );

      return (
        <SidebarMenuItem
          key={item.id}
          className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center select-none"
        >
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-sidebar-accent cursor-pointer transition-colors">
                  <Icon
                    className={`w-4 h-4 ${
                      isDirectActive || isSubActive
                        ? 'text-primary font-bold'
                        : 'text-sidebar-foreground/70'
                    }`}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                align="start"
                className="p-2 z-50 min-w-[180px] bg-popover/90 backdrop-blur-2xl text-popover-foreground border border-border/80 shadow-2xl rounded-[14px] space-y-1"
              >
                <div className="px-2 py-1 font-bold text-xs text-foreground border-b border-border/60 flex items-center justify-between">
                  <span>{itemTitle}</span>
                  {item.badge && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="py-0.5 space-y-0.5">
                  {children?.map((child) => {
                    const childActive = child.id === activeLeafId;
                    return (
                      <Link
                        key={child.id}
                        to={child.url}
                        data-nav-id={child.id}
                        data-active={childActive ? 'true' : 'false'}
                        onClick={handleLinkClick}
                        className={`block px-2.5 py-1.5 rounded-[10px] text-[11px] font-medium transition-colors ${
                          childActive
                            ? 'bg-primary/10 text-primary font-bold dark:bg-primary/20 dark:text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {child.title}
                      </Link>
                    );
                  })}
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            parentNode
          )}

          {/* Render Nested Children when Expanded */}
          {!isCollapsed && isExpanded && (
            <SidebarMenuSub
              id={`subnav-${item.id}`}
              className="ms-3 ps-2.5 border-s border-sidebar-border/60 space-y-0.5 my-1"
            >
              {children!.map((child) => renderNavigationItem(child, depth + 1))}
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>
      );
    }

    // Leaf node: standard navigation link button
    const leafNode = (
      <Link
        to={item.url}
        data-nav-id={item.id}
        data-active={isDirectActive ? 'true' : 'false'}
        aria-current={isDirectActive ? 'page' : undefined}
        onClick={handleLinkClick}
        className={`group relative w-full flex items-center gap-2.5 rounded-[10px] transition-all duration-200 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:p-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ring-offset-sidebar ${
          depth === 0
            ? 'px-3 py-2 text-xs font-semibold min-h-[38px]'
            : 'px-2.5 py-1.5 text-[11px] font-medium min-h-[32px]'
        } ${
          isDirectActive
            ? 'bg-primary/10 text-primary font-bold shadow-2xs dark:bg-primary/20 dark:text-primary-foreground'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground hover:translate-x-0.5'
        }`}
      >
        {isDirectActive && depth === 0 && (
          <span className="absolute -left-1 top-2 bottom-2 w-1 rounded-r-full bg-primary shadow-xs" />
        )}
        <Icon
          className={`shrink-0 w-4 h-4 transition-transform duration-200 group-hover:scale-105 ${
            isDirectActive
              ? 'text-primary'
              : 'text-sidebar-foreground/70 group-hover:text-sidebar-foreground'
          }`}
        />
        {!isCollapsed && <span className="truncate">{itemTitle}</span>}
        {!isCollapsed && item.badge && (
          <span className="ms-auto inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
            {item.badge}
          </span>
        )}
      </Link>
    );

    return (
      <SidebarMenuItem
        key={item.id}
        className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
      >
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{leafNode}</TooltipTrigger>
            <TooltipContent
              side="right"
              align="center"
              className="text-xs font-semibold px-2.5 py-1 z-50 bg-popover/90 backdrop-blur-2xl text-popover-foreground border border-border/80 shadow-md rounded-lg"
            >
              {itemTitle}
            </TooltipContent>
          </Tooltip>
        ) : (
          leafNode
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className={className}>
      {/* 1. Header with EduLyfe Logo, Context Label & Mobile Close Button */}
      <SidebarHeader className="h-16 px-3.5 border-b border-sidebar-border flex items-center justify-between group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:justify-center bg-sidebar/50 backdrop-blur-md">
        <div className="flex items-center justify-between w-full">
          <Link
            to={homeUrl}
            onClick={handleLinkClick}
            className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center min-w-0 group"
          >
            {/* Collapsed State: compact symbol without white box container */}
            <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center shrink-0">
              <img
                src="/brand/edulyfe-symbol-color.png"
                alt="EduLyfe"
                className="w-8 h-8 object-contain shrink-0 dark:hidden"
              />
              <img
                src="/brand/edulyfe-symbol-reversed.png"
                alt="EduLyfe"
                className="w-8 h-8 object-contain shrink-0 hidden dark:block"
              />
            </div>

            {/* Expanded State: official horizontal brand logo from login page */}
            <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-2">
                <img
                  src="/brand/edulyfe-logo-horizontal-color.png"
                  alt="EduLyfe ERP"
                  className="h-8 w-auto object-contain shrink-0 dark:hidden group-hover:scale-[1.02] transition-transform"
                />
                <img
                  src="/brand/edulyfe-logo-horizontal-reversed.png"
                  alt="EduLyfe ERP"
                  className="h-8 w-auto object-contain shrink-0 hidden dark:block group-hover:scale-[1.02] transition-transform"
                />
                <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 rounded-md shrink-0">
                  ERP
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5 truncate">
                {contextLabel}
              </span>
            </div>
          </Link>

          {/* Dedicated Mobile Dismiss Button */}
          {isMobile && (
            <button
              type="button"
              onClick={() => setOpenMobile(false)}
              aria-label="Close navigation sidebar"
              className="p-1.5 rounded-xl hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors cursor-pointer shrink-0 ms-2"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </SidebarHeader>

      {/* 2. Content with Dynamic Recursive Navigation Groups & Sub-items */}
      <SidebarContent className="p-2 space-y-4 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {navGroups.map((group) => (
          <SidebarGroup key={group.id}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-wider text-sidebar-foreground/60 px-3 py-1.5">
                {group.title}
              </SidebarGroupLabel>
            )}

            <SidebarGroupContent>
              <SidebarMenu className="group-data-[collapsible=icon]:items-center space-y-0.5">
                {group.items.map((item) => renderNavigationItem(item, 0))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* 3. Footer with Profile Menu & Theme */}
      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={`w-full flex items-center gap-3 p-2 rounded-[14px] hover:bg-sidebar-accent/80 border border-transparent hover:border-sidebar-border/60 transition-all duration-200 cursor-pointer text-start shadow-2xs ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar size="sm" className="border border-sidebar-border shrink-0">
                <AvatarImage
                  src={
                    (user as any)?.avatar_url ||
                    (user as any)?.avatarUrl ||
                    (user as any)?.profileImage?.url ||
                    (user as any)?.avatar ||
                    (user as any)?.image
                  }
                  alt={displayName}
                />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-black">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>

              {!isCollapsed && (
                <div className="flex flex-col min-w-0 text-start">
                  <span className="text-xs font-black text-sidebar-foreground truncate">
                    {displayName}
                  </span>
                  <span className="text-[10px] font-bold text-sidebar-foreground/60 truncate font-mono">
                    {user?.email || 'authenticated'}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground/50 shrink-0" />
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-60 rounded-[14px] border border-border/80 p-1.5 shadow-2xl bg-popover/90 backdrop-blur-2xl text-popover-foreground animate-in fade-in-50 zoom-in-95 duration-150"
          >
            <DropdownMenuLabel className="px-3 py-2">
              <p className="text-xs font-bold text-foreground">{displayName}</p>
              <Badge
                variant="outline"
                className="mt-1 text-[9px] uppercase font-bold tracking-wider bg-primary/10 text-primary border-primary/20"
              >
                {normalizedRoles[0] || 'USER'}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem
              onClick={() => navigate('/app/profile')}
              className="text-xs font-semibold cursor-pointer rounded-[10px] focus:bg-muted py-2"
            >
              <User className="w-4 h-4 me-2 text-muted-foreground" />
              {t('common.profile', 'User Profile')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/app/settings')}
              className="text-xs font-semibold cursor-pointer rounded-[10px] focus:bg-muted py-2"
            >
              <Settings className="w-4 h-4 me-2 text-muted-foreground" />
              {t('common.settings', 'Settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-xs font-bold text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-[10px] py-2 transition-colors"
            >
              <LogOut className="w-4 h-4 me-2 text-destructive" />
              {t('common.logout', 'Sign Out')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};

export default AppSidebar;
