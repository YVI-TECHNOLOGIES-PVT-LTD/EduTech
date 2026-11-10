import React, { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Search, ChevronRight } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ProfileMenu } from '@/components/shell/ProfileMenu';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { useCommandPalette } from '@/hooks/layout/useCommandPalette';
import { NotificationPopover } from '@/features/notifications';
import { parseBreadcrumbs } from '@/lib/breadcrumb';
import { Badge } from '@/components/ui/badge';

export const AppNavbar: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const { focusSearch } = useCommandPalette();

  const breadcrumbs = useMemo(() => {
    return parseBreadcrumbs(location.pathname);
  }, [location.pathname]);

  const currentTitle =
    breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : 'Dashboard';

  const userRoles = (user?.roles || []).map((r: string) => String(r).toUpperCase());
  const isFrontOffice = userRoles.some((r) =>
    ['FRONT_OFFICE', 'FO', 'RECEPTIONIST', 'ADMISSION_OFFICER', 'COUNSELOR', 'COUNSELLOR'].includes(
      r,
    ),
  );
  const deskLabel = isFrontOffice
    ? 'Front Office Desk'
    : userRoles.includes('ADMIN') || userRoles.includes('SUPERADMIN')
      ? 'Admin Desk'
      : userRoles.includes('FINANCE')
        ? 'Finance Desk'
        : null;

  return (
    <header className="bg-card/85 backdrop-blur-md border-b border-border/80 sticky top-0 z-30 transition-all duration-300">
      <div className="h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left / Start: Sidebar Trigger & Breadcrumbs / Active Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <SidebarTrigger
            aria-label="Toggle sidebar"
            className="p-2 border border-border/80 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
          />

          <div className="h-5 w-px bg-border/80 hidden sm:block shrink-0" />

          {/* Desktop Breadcrumb Trail */}
          <nav
            aria-label="Breadcrumbs"
            className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground font-medium min-w-0"
          >
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={b.path || i}>
                {i > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                )}
                {b.isLast ? (
                  <span
                    className="font-bold text-foreground truncate max-w-[200px]"
                    title={b.label}
                  >
                    {b.label}
                  </span>
                ) : (
                  <Link
                    to={b.path}
                    className="hover:text-foreground transition-colors truncate max-w-[140px]"
                    title={b.label}
                  >
                    {b.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Mobile & Tablet Current Page Title */}
          <div className="flex md:hidden items-center min-w-0">
            <span
              className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[140px] sm:max-w-xs"
              title={currentTitle}
            >
              {currentTitle}
            </span>
          </div>

          {/* Desk Badge (Large Screens) */}
          {deskLabel && (
            <Badge
              variant="outline"
              className="hidden xl:inline-flex text-[10px] font-bold uppercase tracking-wider bg-muted/40 border-border/80 text-muted-foreground px-2 py-0.5 rounded-lg shrink-0"
            >
              {deskLabel}
            </Badge>
          )}
        </div>

        {/* Right / End: Search, Language, Theme, Notifications & Profile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Desktop Search Button */}
          <button
            onClick={() => focusSearch()}
            aria-label={t('common.searchPlaceholder', 'Search applications, documents, and fees')}
            className="hidden sm:flex items-center justify-between gap-3 px-3 py-1.5 bg-muted/40 hover:bg-muted/80 border border-border/80 rounded-xl text-xs text-muted-foreground font-medium transition-colors cursor-pointer w-44 md:w-56 lg:w-64"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                {t('common.searchPlaceholder', 'Search applications, fees...')}
              </span>
            </div>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground bg-card rounded-md border border-border/80 shadow-xs font-mono shrink-0">
              Ctrl K
            </kbd>
          </button>

          {/* Mobile Search Icon Button */}
          <button
            onClick={() => focusSearch()}
            aria-label={t('common.search', 'Search')}
            className="sm:hidden p-2 rounded-xl border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Multi-Language Selector */}
          <LanguageSwitcher variant="compact" />

          {/* Global Theme Switcher */}
          <ThemeSwitcher />

          {/* Notification Popover */}
          <NotificationPopover />

          <div className="h-6 w-px bg-border/80 hidden sm:block shrink-0" />

          {/* Profile Dropdown */}
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
};

export default AppNavbar;
