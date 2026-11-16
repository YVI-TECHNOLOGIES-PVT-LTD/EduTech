import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Search, ChevronRight } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ProfileMenu } from '@/components/shell/ProfileMenu';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { CommandPalette } from '@/components/search/CommandPalette';
import { ParentSearchModal } from '@/components/search/ParentSearchModal';
import { NotificationPopover } from '@/features/notifications';
import { parseBreadcrumbs } from '@/lib/breadcrumb';
import { TopbarSkeleton } from '@/components/shell/NavSkeleton';
import { ParentChildTopbarSelector } from '@/components/shell/ParentChildTopbarSelector';

export const AppNavbar: React.FC = () => {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isParentSearchOpen, setIsParentSearchOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

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

  const isParentPortal = location.pathname.startsWith('/app/parent');
  const isParentUser = userRoles.some((r) => ['PARENT', 'GUARDIAN', 'ENROLLED_PARENT'].includes(r));
  // Selector appears globally throughout the authenticated Parent Portal.
  // Never expose this selector in Admin, Finance, Teacher, or unrelated portals.
  const isUnrelatedPortal = [
    '/app/admin',
    '/app/super-admin',
    '/app/teacher',
    '/app/finance',
    '/app/front-office',
    '/app/academic',
    '/app/student',
  ].some((prefix) => location.pathname.startsWith(prefix));

  const showChildSelector = isParentPortal || (isParentUser && !isUnrelatedPortal);

  // Global ⌘K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (showChildSelector) {
          setIsParentSearchOpen((prev) => !prev);
        } else {
          setIsCommandPaletteOpen((prev) => !prev);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showChildSelector]);

  const breadcrumbs = useMemo(() => {
    return parseBreadcrumbs(location.pathname);
  }, [location.pathname]);

  const currentTitle =
    breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : 'Dashboard';

  // Prevent layout shift during genuine initial authentication / route resolution
  if (loading && !user) {
    return <TopbarSkeleton />;
  }

  return (
    <header className="h-16 bg-card/85 backdrop-blur-xl border-b border-border sticky top-0 z-20 shadow-2xs">
      <div className="h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left / Start: Sidebar Trigger & Breadcrumbs / Active Title */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
          <SidebarTrigger
            aria-label="Toggle sidebar navigation"
            className="p-2 border border-border/70 rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-2xs shrink-0 cursor-pointer"
          />

          <div className="h-5 w-px bg-border/60 hidden sm:block shrink-0" />

          {/* Desktop Breadcrumb Trail */}
          <nav
            aria-label="Breadcrumbs"
            className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground font-medium min-w-0"
          >
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={b.path || i}>
                {i > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                )}
                {b.isLast ? (
                  <span
                    className="font-bold text-foreground bg-muted/40 border border-border/50 px-2 py-0.5 rounded-lg shadow-2xs truncate max-w-[200px]"
                    title={b.label}
                  >
                    {b.label}
                  </span>
                ) : (
                  <Link
                    to={b.path}
                    className="hover:text-foreground hover:bg-muted/60 px-2 py-0.5 rounded-lg transition-all duration-150 truncate max-w-[140px]"
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
            <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 shadow-2xs shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>{deskLabel}</span>
            </div>
          )}
        </div>

        {/* Global Parent Child Selector: Positioned after breadcrumb context, before search */}
        {showChildSelector && (
          <div className="flex items-center px-1 sm:px-2 shrink-0">
            <ParentChildTopbarSelector />
          </div>
        )}

        {/* Right / End: Search, Language, Theme, Notifications & Profile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {showChildSelector ? (
            /* Parent Portal: Compact Search Icon Button (Opens Search Modal for Applications, Fees & Students) */
            <button
              onClick={() => setIsParentSearchOpen(true)}
              aria-label="Search applications, fees, students..."
              title="Search applications, fees, students (⌘K)"
              className="flex items-center justify-center p-2 sm:p-2.5 rounded-xl border border-border/70 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-2xs cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Search className="w-4 h-4" />
            </button>
          ) : (
            /* Other Dashboards: Retain Expanded Desktop Search Button & Mobile Icon Button */
            <>
              {/* Desktop Search Button */}
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                aria-label={t(
                  'common.searchPlaceholder',
                  'Search applications, documents, and fees',
                )}
                className="hidden sm:flex items-center justify-between gap-3 px-3.5 py-1.5 bg-muted/40 hover:bg-muted/70 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 border border-border/70 rounded-xl text-xs text-muted-foreground font-medium transition-all duration-200 hover:shadow-2xs group cursor-pointer w-44 md:w-56 lg:w-64"
              >
                <div className="flex items-center gap-2 truncate">
                  <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  <span className="truncate group-hover:text-foreground/90 transition-colors">
                    {t('common.searchPlaceholder', 'Search applications, fees...')}
                  </span>
                </div>
                <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground bg-background/80 rounded-md border border-border/70 shadow-2xs font-mono shrink-0">
                  <span className="text-[11px] font-sans">⌘</span>K
                </kbd>
              </button>

              {/* Mobile Search Icon Button */}
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                aria-label={t('common.search', 'Search')}
                className="sm:hidden p-2 rounded-lg border border-border/70 hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-2xs cursor-pointer shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Multi-Language Selector */}
          <LanguageSwitcher variant="compact" />

          {/* Global Theme Switcher */}
          <ThemeSwitcher />

          {/* Notification Popover */}
          <NotificationPopover />

          <div className="h-6 w-px bg-border/60 hidden sm:block shrink-0" />

          {/* Profile Dropdown */}
          <ProfileMenu />
        </div>
      </div>

      {/* Parent Portal Global Search Modal: Dedicated search for Applications, Fees & Students */}
      {showChildSelector && (
        <ParentSearchModal
          isOpen={isParentSearchOpen}
          onClose={() => setIsParentSearchOpen(false)}
        />
      )}

      {/* Other Portals: Navigation Command Palette */}
      {!showChildSelector && isCommandPaletteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Command Palette"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsCommandPaletteOpen(false)}
        >
          <div
            className="w-full max-w-xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <CommandPalette
              isOpen={isCommandPaletteOpen}
              onClose={() => setIsCommandPaletteOpen(false)}
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default AppNavbar;
