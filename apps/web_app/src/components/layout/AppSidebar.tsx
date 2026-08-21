import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  User,
  LogOut,
  Settings,
  HelpCircle,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getNavigationForUser, NavigationGroup, NavigationItem } from '../../config/navigation';
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
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  useSidebar,
} from '../ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { getInitials } from '@/lib/utils';

interface AppSidebarProps {
  className?: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ className }) => {
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
  const navGroups = getNavigationForUser(userRoles);
  const currentPath = location.pathname;

  const contextLabel = navGroups[0]?.contextLabel || 'EDUTRACK PORTAL';

  const isItemActive = (item: NavigationItem): boolean => {
    if (currentPath === item.url) return true;
    if (
      item.url !== '/app/dashboard' &&
      item.url !== '/app/workspace' &&
      currentPath.startsWith(item.url)
    ) {
      return true;
    }
    if (
      item.items &&
      item.items.some((sub) => currentPath === sub.url || currentPath.startsWith(sub.url))
    ) {
      return true;
    }
    return false;
  };

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
  const userInitials =
    displayName
      .split(' ')
      .map((n: string) => n.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2) || 'U';

  const homeUrl = navGroups[0]?.items[0]?.url || '/app/workspace';

  return (
    <Sidebar collapsible="icon" className={className}>
      {/* 1. Header with EduTrack Logo & Context Label */}
      <SidebarHeader className="p-3.5 border-b border-sidebar-border group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
        <Link
          to={homeUrl}
          className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-600/30 shrink-0">
            E
          </div>

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

      {/* 2. Content with Dynamic Navigation Groups & Sub-items */}
      <SidebarContent className="p-2 space-y-4">
        {navGroups.map((group) => (
          <SidebarGroup key={group.id}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-wider text-sidebar-foreground/60 px-2 py-1">
                {group.title}
              </SidebarGroupLabel>
            )}

            <SidebarGroupContent>
              <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                {group.items.map((item) => {
                  const Icon = item.icon || Building;
                  const active = isItemActive(item);
                  const hasSubItems = Boolean(item.items && item.items.length > 0);

                  if (hasSubItems) {
                    return (
                      <SidebarMenuItem
                        key={item.id}
                        className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                      >
                        <SidebarMenuButton
                          render={<Link to={item.url} />}
                          isActive={active}
                          tooltip={item.title}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:p-0 ${
                            active
                              ? 'bg-black text-white dark:bg-white dark:text-black shadow-md hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 group-data-[collapsible=icon]:justify-center">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${active ? 'text-white dark:text-black' : 'text-sidebar-foreground'}`}
                            />
                            {!isCollapsed && <span>{item.title}</span>}
                          </div>
                          {!isCollapsed && (
                            <ChevronDown
                              className={`w-3.5 h-3.5 ${active ? 'text-white dark:text-black' : 'text-sidebar-foreground/70'}`}
                            />
                          )}
                        </SidebarMenuButton>

                        {!isCollapsed && (
                          <SidebarMenuSub className="ml-4 border-l border-sidebar-border pl-2 my-1 space-y-1">
                            {item.items!.map((subItem) => {
                              const subActive =
                                currentPath === subItem.url || currentPath.startsWith(subItem.url);
                              const SubIcon = subItem.icon || Building;

                              return (
                                <SidebarMenuSubItem key={subItem.id}>
                                  <SidebarMenuSubButton
                                    render={<Link to={subItem.url} />}
                                    isActive={subActive}
                                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                      subActive
                                        ? 'bg-black text-white dark:bg-white dark:text-black font-extrabold shadow-xs hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
                                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                    }`}
                                  >
                                    <SubIcon
                                      className={`w-3.5 h-3.5 ${subActive ? 'text-white dark:text-black' : 'text-sidebar-foreground'}`}
                                    />
                                    <span>{subItem.title}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem
                      key={item.id}
                      className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                    >
                      <SidebarMenuButton
                        render={<Link to={item.url} />}
                        isActive={active}
                        tooltip={item.title}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:p-0 ${
                          active
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-md hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${active ? 'text-white dark:text-black' : 'text-sidebar-foreground'}`}
                        />
                        {!isCollapsed && <span>{item.title}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* 3. Footer with User Profile Dropdown & Sign Out */}
      <SidebarFooter className="p-3 border-t border-sidebar-border group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-sidebar-accent transition-colors focus:outline-none text-left cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
            <div className="flex items-center space-x-2.5 min-w-0 group-data-[collapsible=icon]:justify-center">
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
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-sidebar-foreground truncate">
                    {displayName}
                  </span>
                  <span className="text-[9px] font-bold text-sidebar-foreground/50 truncate">
                    {user?.email || 'user@edutrack.com'}
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
            className="w-56 rounded-2xl border-sidebar-border p-1 shadow-xl"
          >
            <DropdownMenuLabel className="px-3 py-2">
              <p className="text-xs font-bold text-sidebar-foreground">{displayName}</p>
              <Badge variant="info" className="mt-1">
                {userRoles[0] || 'USER'}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate('/app/profile')}
              className="text-xs font-semibold cursor-pointer rounded-xl"
            >
              <User className="w-4 h-4 mr-2 text-sidebar-foreground/60" />
              User Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/app/settings')}
              className="text-xs font-semibold cursor-pointer rounded-xl"
            >
              <Settings className="w-4 h-4 mr-2 text-sidebar-foreground/60" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-xs font-bold text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer rounded-xl"
            >
              <LogOut className="w-4 h-4 mr-2 text-red-500" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
};
