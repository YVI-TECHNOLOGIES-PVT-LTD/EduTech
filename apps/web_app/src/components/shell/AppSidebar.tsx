import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  User,
  LogOut,
  Settings,
  Building,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
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

interface AppSidebarProps {
  className?: string;
}

const EXPANDED_STORAGE_KEY = 'edutrack.sidebar.expanded';

/**
 * Check if a path matches an item's url directly or with query params
 */
function isItemDirectlyActive(
  item: NavigationItem,
  currentPath: string,
  currentSearch: string = '',
): boolean {
  if (!item.url) return false;
  const fullCurrentUrl = currentPath + currentSearch;

  // Exact match with query params if item.url specifies query params
  if (item.url.includes('?')) {
    return item.url === fullCurrentUrl;
  }

  // Exact match with path
  if (item.url === currentPath) {
    // If current URL has search params, but another item in the menu matches the search params, don't prioritize non-query item
    return true;
  }

  // Prefix match for detail routes (e.g. /app/admissions/applications/:id -> /app/admissions/applications)
  if (
    item.url !== '/app/dashboard' &&
    item.url !== '/app/workspace' &&
    item.url !== '/app/admissions' &&
    item.url !== '/app' &&
    currentPath.startsWith(item.url + '/')
  ) {
    return true;
  }

  return false;
}

/**
 * Recursively check if an item or any of its descendants is active
 */
function isItemOrDescendantActive(
  item: NavigationItem,
  currentPath: string,
  currentSearch: string = '',
): boolean {
  if (isItemDirectlyActive(item, currentPath, currentSearch)) return true;

  const children = item.items || item.children;
  if (children && children.length > 0) {
    return children.some((child) => isItemOrDescendantActive(child, currentPath, currentSearch));
  }
  return false;
}

/**
 * Collect all ancestor IDs for an active item based on current URL
 */
function findActiveAncestorIds(
  items: NavigationItem[],
  currentPath: string,
  currentSearch: string = '',
  ancestors: string[] = [],
): string[] {
  let activeIds: string[] = [];

  for (const item of items) {
    const children = item.items || item.children;
    const isDirectMatch = isItemDirectlyActive(item, currentPath, currentSearch);

    if (isDirectMatch) {
      activeIds = activeIds.concat(ancestors);
    }

    if (children && children.length > 0) {
      const childActiveIds = findActiveAncestorIds(children, currentPath, currentSearch, [
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
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const userRoles =
    user?.roles && user.roles.length > 0
      ? user.roles
      : (user as any)?.role
        ? [(user as any).role]
        : ['PARENT'];
  const isPostAdmission = Boolean(
    (user as any)?.hasEnrolledStudent ||
    (user as any)?.isPostAdmission ||
    userRoles.includes('ENROLLED_PARENT'),
  );
  const navGroups = getNavigationForUser(userRoles, isPostAdmission);
  const currentPath = location.pathname;

  const contextLabel = navGroups[0]?.contextLabel || 'ADMISSION PORTAL';

  // Expanded state loaded from localStorage
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(EXPANDED_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return new Set<string>(parsed);
        }
      }
    } catch {}
    // Default: 'fo_admissions' expanded initially for front office
    return new Set<string>(['fo_admissions']);
  });

  // Auto-expand all ancestors of the currently active route
  useEffect(() => {
    const allItems = navGroups.flatMap((g) => g.items);
    const activeAncestors = findActiveAncestorIds(allItems, currentPath, location.search);

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
  }, [currentPath, location.search, navGroups]);

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

  const homeUrl = navGroups[0]?.items[0]?.url || '/app/workspace';

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
    const isDirectActive = isItemDirectlyActive(item, currentPath, location.search);
    const isSubActive = isItemOrDescendantActive(item, currentPath, location.search);
    const Icon = item.icon || Building;
    const itemTitle = getNavTitle(item);

    // If item has children, render expandable parent node
    if (hasChildren) {
      return (
        <SidebarMenuItem
          key={item.id}
          className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center select-none"
        >
          <div
            className={`w-full flex items-center justify-between rounded-xl transition-all ${
              depth === 0
                ? 'px-2.5 py-2 text-xs font-bold'
                : 'px-2 py-1.5 text-[11px] font-semibold'
            } ${
              isDirectActive
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs font-extrabold'
                : isSubActive
                  ? 'bg-sidebar-accent/50 text-sidebar-foreground font-bold'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
            }`}
          >
            {/* Left Action: Navigate or Toggle */}
            <Link
              to={item.url}
              onClick={(e) => {
                if (!item.url || item.url === '#') {
                  e.preventDefault();
                  toggleExpanded(item.id);
                }
              }}
              className="flex-1 flex items-center gap-2.5 min-w-0 group-data-[collapsible=icon]:justify-center cursor-pointer"
              title={isCollapsed ? itemTitle : undefined}
            >
              <Icon
                className={`shrink-0 ${depth === 0 ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${
                  isDirectActive
                    ? 'text-white dark:text-black'
                    : isSubActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-sidebar-foreground/70'
                }`}
              />
              {!isCollapsed && <span className="truncate">{itemTitle}</span>}
            </Link>

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
                className={`p-1 rounded-lg hover:bg-sidebar-border/40 transition-transform cursor-pointer shrink-0 ${
                  isDirectActive ? 'text-white dark:text-black' : 'text-sidebar-foreground/60'
                }`}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          {/* Render Nested Children when Expanded */}
          {!isCollapsed && isExpanded && (
            <SidebarMenuSub
              id={`subnav-${item.id}`}
              className="ms-3 ps-2 border-s border-sidebar-border/60 space-y-0.5 my-1"
            >
              {children!.map((child) => renderNavigationItem(child, depth + 1))}
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>
      );
    }

    // Leaf node: standard navigation link button
    return (
      <SidebarMenuItem
        key={item.id}
        className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
      >
        <Link
          to={item.url}
          title={isCollapsed ? itemTitle : undefined}
          className={`w-full flex items-center gap-2.5 rounded-xl transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:p-0 cursor-pointer ${
            depth === 0 ? 'px-2.5 py-2 text-xs font-bold' : 'px-2 py-1.5 text-[11px] font-semibold'
          } ${
            isDirectActive
              ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs font-extrabold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
          }`}
        >
          <Icon
            className={`shrink-0 ${depth === 0 ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${
              isDirectActive ? 'text-white dark:text-black' : 'text-sidebar-foreground/70'
            }`}
          />
          {!isCollapsed && <span className="truncate">{itemTitle}</span>}
        </Link>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className={className}>
      {/* 1. Header with EduTrack Logo & Context Label */}
      <SidebarHeader className="p-3.5 border-b border-sidebar-border group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
        <Link
          to={homeUrl}
          className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
        >
          <img
            src="/EduTrack_logo.png"
            alt="EduTrack"
            className="w-10 h-10 object-contain drop-shadow-md shrink-0"
          />

          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-black tracking-tight text-sidebar-foreground leading-none">
                EduTrack
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-sidebar-foreground/70 mt-1 truncate">
                {contextLabel}
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      {/* 2. Content with Dynamic Recursive Navigation Groups & Sub-items */}
      <SidebarContent className="p-2 space-y-4">
        {navGroups.map((group) => (
          <SidebarGroup key={group.id}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-wider text-sidebar-foreground/60 px-2 py-1">
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
            className={`w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-sidebar-accent transition-all cursor-pointer text-start ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar size="sm" className="border border-sidebar-border shrink-0">
                <AvatarImage
                  src={(user as any)?.avatar_url || (user as any)?.avatar || (user as any)?.image}
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
            className="w-56 rounded-2xl border-sidebar-border p-1.5 shadow-xl bg-white dark:bg-black"
          >
            <DropdownMenuLabel className="px-3 py-2">
              <p className="text-xs font-bold text-sidebar-foreground">{displayName}</p>
              <Badge variant="info" className="mt-1 text-[9px] uppercase">
                {userRoles[0] || 'USER'}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate('/app/profile')}
              className="text-xs font-semibold cursor-pointer rounded-xl"
            >
              <User className="w-4 h-4 me-2 text-sidebar-foreground/60" />
              {t('common.profile', 'User Profile')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/app/settings')}
              className="text-xs font-semibold cursor-pointer rounded-xl"
            >
              <Settings className="w-4 h-4 me-2 text-sidebar-foreground/60" />
              {t('common.settings', 'Settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-xs font-bold text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer rounded-xl"
            >
              <LogOut className="w-4 h-4 me-2 text-red-500" />
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
