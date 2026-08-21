import React from 'react';
import { User, LogOut, Settings, Shield } from 'lucide-react';
import { useAppDispatch, useAppSelector, RootState } from '@/app/store';
import { logout } from '@/shared/store/authSlice';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage, AvatarBadge } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

export const ProfileMenu: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate(ROUTES.AUTH.LOGIN, { replace: true });
  };

  const displayName =
    user?.full_name ||
    ((user as any)?.firstName
      ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim()
      : 'User');
  const avatarUrl = (user as any)?.avatar_url || (user as any)?.avatar || (user as any)?.image;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Open profile menu"
          className="flex items-center space-x-2 rounded-full ring-2 ring-transparent transition hover:ring-primary focus:outline-none"
        >
          <Avatar size="sm" className="border border-border shrink-0">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {getInitials(displayName)}
            </AvatarFallback>
            <AvatarBadge variant="online" size="sm" />
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {user?.full_name || displayName}
            </p>
            <p className="text-[11px] text-slate-500">{user?.email}</p>
            <span className="inline-block text-[10px] font-semibold text-blue-600 uppercase tracking-wide">
              {user?.roles?.[0] || 'Administrator'}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate(ROUTES.APP.ORGANIZATION)}
          className="text-xs font-medium cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate(ROUTES.APP.ROLES)}
          className="text-xs font-medium cursor-pointer"
        >
          <Shield className="mr-2 h-4 w-4" />
          My Permissions
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-xs font-medium text-rose-600 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
