import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAppSelector, RootState } from '@/app/store';
import { getSidebarNavigation } from '@/shared/registry/navigation';
import { usePermission } from '@/shared/auth/usePermission';
import { APP_CONFIG } from '@/config/app';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const sidebarOpen = useAppSelector((state: RootState) => state.ui.sidebarOpen);
  const { hasPermission } = usePermission();
  const location = useLocation();

  const navigation = getSidebarNavigation();

  if (!sidebarOpen) {
    return null;
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-white text-black dark:bg-black dark:text-white shadow-xl">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <img
            src="/EduTrack_logo.png"
            alt="EduTrack"
            className="h-9 w-9 object-contain rounded-lg shadow-md shrink-0"
          />
          <div>
            <h1 className="text-sm font-bold tracking-tight text-black dark:text-white">
              {APP_CONFIG.name}
            </h1>
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">
              Stage-1 Admin
            </span>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigation.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {section.sectionTitle}
            </h3>

            <div className="mt-2 space-y-1">
              {section.items.map((item) => {
                if (item.permission && !hasPermission(item.permission)) {
                  return null;
                }

                const Icon = item.icon;
                const isActive = location.pathname.startsWith(item.path);

                if (item.children) {
                  return (
                    <div key={item.path} className="space-y-1">
                      <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-black dark:text-white">
                        <div className="flex items-center space-x-2.5">
                          {Icon && <Icon className="h-4 w-4 text-black dark:text-white" />}
                          <span>{item.title}</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="ml-6 space-y-1 border-l border-border pl-2">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) =>
                              cn(
                                'block rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                isActive
                                  ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                                  : 'text-black/80 dark:text-white/80 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-black dark:hover:text-white',
                              )
                            }
                          >
                            {child.title}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center space-x-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                        isActive
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                          : 'text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900',
                      )
                    }
                  >
                    {Icon && (
                      <Icon
                        className={cn(
                          'h-4 w-4',
                          isActive ? 'text-white dark:text-black' : 'text-black dark:text-white',
                        )}
                      />
                    )}
                    <span>{item.title}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4 text-[11px] text-muted-foreground text-center">
        {APP_CONFIG.copyright}
      </div>
    </aside>
  );
};
