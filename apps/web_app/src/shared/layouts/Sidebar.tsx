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
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-slate-900 text-white shadow-xl dark:border-slate-800">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-black text-white shadow-md">
            E
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">{APP_CONFIG.name}</h1>
            <span className="text-[10px] font-semibold uppercase text-blue-400">Stage-1 Admin</span>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigation.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                      <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-300">
                        <div className="flex items-center space-x-2.5">
                          {Icon && <Icon className="h-4 w-4 text-slate-400" />}
                          <span>{item.title}</span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-slate-500" />
                      </div>
                      <div className="ml-6 space-y-1 border-l border-slate-800 pl-2">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) =>
                              cn(
                                'block rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                isActive
                                  ? 'bg-blue-600 text-white font-semibold'
                                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
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
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                      )
                    }
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{item.title}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4 text-[11px] text-slate-500 text-center">
        {APP_CONFIG.copyright}
      </div>
    </aside>
  );
};
