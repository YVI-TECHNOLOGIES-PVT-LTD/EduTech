import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { User, LogOut, Settings, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage, AvatarBadge } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const ProfileMenu: React.FC = () => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const rawRoles: string[] =
    Array.isArray(user?.roles) && user.roles.length > 0
      ? user.roles
      : (user as any)?.role
        ? [(user as any).role]
        : [];
  const normalizedRoles = rawRoles.map((r: string) =>
    r
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_'),
  );
  const primaryRole = (normalizedRoles[0] || 'MEMBER').replace(/_/g, ' ').toUpperCase();

  const isFinance = normalizedRoles.some((r) =>
    ['FINANCE', 'FINANCE_OFFICER', 'ACCOUNTANT', 'FINANCE_MANAGER', 'BURSAR'].includes(r),
  );

  const isFrontOfficeDesk = normalizedRoles.some((r) =>
    [
      'FRONT_OFFICE',
      'FO',
      'RECEPTIONIST',
      'STAFF',
      'ADMISSION_OFFICER',
      'ADMISSIONS_OFFICER',
      'COUNSELLOR',
      'COUNSELOR',
      'ADMIN',
      'SUPERADMIN',
      'SUPER_ADMIN',
      'ORG_ADMIN',
      'HOI',
      'PRINCIPAL',
      'HEAD_OF_INSTITUTE',
    ].includes(r),
  );

  const isParent = normalizedRoles.some((r) =>
    ['PARENT', 'GUARDIAN', 'ENROLLED_PARENT'].includes(r),
  );

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
      : 'EduLyfe User');
  const avatarUrl =
    (user as any)?.avatar_url ||
    (user as any)?.avatarUrl ||
    (user as any)?.profileImage?.url ||
    (user as any)?.avatar ||
    (user as any)?.image ||
    (user as any)?.profile_photo_url;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open user menu"
        className="flex items-center space-x-2.5 p-1 rounded-lg hover:bg-muted/80 border border-transparent hover:border-border/60 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer group"
      >
        <Avatar
          size="sm"
          className="border border-border/70 shrink-0 group-hover:scale-105 transition-transform duration-200"
        >
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-primary/10 text-primary font-bold">
            {getInitials(displayName)}
          </AvatarFallback>
          <AvatarBadge variant="online" size="sm" className="ring-2 ring-background" />
        </Avatar>
        <div className="hidden sm:flex flex-col text-left min-w-0 pr-1">
          <span className="text-xs font-bold text-foreground leading-none truncate max-w-[140px]">
            {displayName}
          </span>
          <span className="text-[9px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">
            {primaryRole}
          </span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-60 rounded-[14px] border border-border/80 p-1.5 shadow-2xl bg-popover/90 backdrop-blur-2xl text-popover-foreground animate-in fade-in-50 zoom-in-95 duration-150"
      >
        <DropdownMenuLabel className="px-3 py-2">
          <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
          <p className="text-[10px] text-muted-foreground font-mono truncate">
            {user?.email || 'authenticated'}
          </p>
          <Badge
            variant="outline"
            className="mt-1.5 text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary border-primary/20"
          >
            {primaryRole}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/60" />
        <DropdownMenuItem
          onClick={() => navigate(isParent ? '/app/parent/profile' : '/app/profile')}
          className="text-xs font-semibold cursor-pointer rounded-[10px] focus:bg-muted hover:bg-muted transition-colors py-2"
        >
          <User className="w-4 h-4 mr-2.5 text-muted-foreground" />
          {t('common.profile', 'User Profile')}
        </DropdownMenuItem>
        {isParent && (
          <DropdownMenuItem
            onClick={() => navigate('/app/admissions/my')}
            className="text-xs font-semibold cursor-pointer rounded-[10px] focus:bg-muted hover:bg-muted transition-colors py-2"
          >
            <FileText className="w-4 h-4 mr-2.5 text-muted-foreground" />
            {t('navigation.myApplications', 'My Applications')}
          </DropdownMenuItem>
        )}
        {isFinance && (
          <DropdownMenuItem
            onClick={() => navigate('/app/finance/dashboard')}
            className="text-xs font-semibold cursor-pointer rounded-[10px] focus:bg-muted hover:bg-muted transition-colors py-2"
          >
            <FileText className="w-4 h-4 mr-2.5 text-muted-foreground" />
            {t('navigation.financeDashboard', 'Finance Dashboard')}
          </DropdownMenuItem>
        )}
        {isFrontOfficeDesk && (
          <DropdownMenuItem
            onClick={() => navigate('/app/front-office/dashboard')}
            className="text-xs font-semibold cursor-pointer rounded-[10px] focus:bg-muted hover:bg-muted transition-colors py-2"
          >
            <FileText className="w-4 h-4 mr-2.5 text-muted-foreground" />
            {t('navigation.frontOfficeDesk', 'Front Office Desk')}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => navigate(isParent ? '/app/parent/settings' : '/app/settings')}
          className="text-xs font-semibold cursor-pointer rounded-[10px] focus:bg-muted hover:bg-muted transition-colors py-2"
        >
          <Settings className="w-4 h-4 mr-2.5 text-muted-foreground" />
          {t('common.settings', 'Settings')}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/60" />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="text-xs font-bold text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-[10px] py-2 transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2.5 text-destructive" />
          {t('common.logout', 'Sign Out')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileMenu;
