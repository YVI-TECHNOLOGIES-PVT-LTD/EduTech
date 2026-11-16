import React from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { useAppDispatch, useAppSelector, RootState } from '@/app/store';
import { setActiveTenant } from '@/shared/store/tenantSlice';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const OrganizationSwitcher: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tenantName } = useAppSelector((state: RootState) => state.tenant);
  const user = useAppSelector((state: RootState) => state.auth.user);

  const displayTenant = tenantName || user?.school_id || 'Main Campus';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900">
          <Building2 className="h-4 w-4 text-blue-600" />
          <span className="max-w-[120px] truncate">{displayTenant}</span>
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs font-medium text-slate-400">
          Active Institution / Campus
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => dispatch(setActiveTenant({ id: 'tenant-main', name: 'Main Campus' }))}
          className="text-xs font-medium cursor-pointer"
        >
          Main Campus (Default)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => dispatch(setActiveTenant({ id: 'tenant-north', name: 'North Branch' }))}
          className="text-xs font-medium cursor-pointer"
        >
          North Branch Campus
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
