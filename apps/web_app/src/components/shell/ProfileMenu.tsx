import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const ProfileMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const userRoles =
    user?.roles && user.roles.length > 0 ? user.roles : [(user as any)?.role || 'PARENT'];
  const primaryRole = (userRoles[0] || 'PARENT').replace(/_/g, ' ').toUpperCase();

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open user menu"
        className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-muted transition-colors focus:outline-none cursor-pointer"
      >
        <Avatar className="w-8 h-8 border border-indigo-200 shrink-0">
          <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-xs">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="hidden sm:flex flex-col text-left min-w-0">
          <span className="text-xs font-bold text-slate-900 dark:text-white leading-none truncate max-w-[140px]">
            {displayName}
          </span>
          <span className="text-[9px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">
            {primaryRole}
          </span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 rounded-2xl border-slate-100 p-1.5 shadow-xl"
      >
        <DropdownMenuLabel className="px-3 py-2">
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
          <p className="text-[10px] text-slate-400 truncate">
            {user?.email || 'user@edutrack.com'}
          </p>
          <Badge variant="info" className="mt-1 text-[9px] uppercase">
            {primaryRole}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuItem
          onClick={() => navigate('/app/profile')}
          className="text-xs font-semibold cursor-pointer rounded-xl"
        >
          <User className="w-4 h-4 mr-2 text-slate-400" />
          User Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('/app/admissions/my')}
          className="text-xs font-semibold cursor-pointer rounded-xl"
        >
          <FileText className="w-4 h-4 mr-2 text-slate-400" />
          My Applications
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('/app/settings')}
          className="text-xs font-semibold cursor-pointer rounded-xl"
        >
          <Settings className="w-4 h-4 mr-2 text-slate-400" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-slate-100" />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="text-xs font-bold text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer rounded-xl"
        >
          <LogOut className="w-4 h-4 mr-2 text-red-500" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileMenu;
