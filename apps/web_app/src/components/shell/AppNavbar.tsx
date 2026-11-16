import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Search } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ProfileMenu } from '@/components/shell/ProfileMenu';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { useCommandPalette } from '@/hooks/layout/useCommandPalette';
import { NotificationPopover } from '@/features/notifications';

export const AppNavbar: React.FC = () => {
  const { t } = useLanguage();
  const { focusSearch } = useCommandPalette();

  return (
    <header className="bg-card/80 backdrop-blur-md border-b border-border/80 sticky top-0 z-30 transition-all duration-300">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left / Start: Sidebar Trigger & Global Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <SidebarTrigger
            aria-label="Toggle sidebar"
            className="p-2 border border-border/80 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          />

          <button
            onClick={() => focusSearch()}
            aria-label={t('common.searchPlaceholder', 'Search applications, documents, and fees')}
            className="w-full flex items-center justify-between px-3.5 py-2 bg-muted/40 hover:bg-muted/80 border border-border/80 rounded-xl text-xs text-muted-foreground font-medium transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="hidden sm:inline">
                {t('common.searchPlaceholder', 'Search applications, documents, fees...')}
              </span>
              <span className="sm:hidden">{t('common.search', 'Search...')}</span>
            </div>
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold text-muted-foreground bg-card rounded-lg border border-border/80 shadow-xs font-mono">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right / End: Language Switcher, Theme Switcher, Notifications & Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Multi-Language Selector */}
          <LanguageSwitcher variant="compact" />

          {/* Global Theme Switcher */}
          <ThemeSwitcher />

          {/* Notification Popover */}
          <NotificationPopover />

          <div className="h-6 w-[1px] bg-border/80 hidden sm:block" />

          {/* Profile Dropdown */}
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
};

export default AppNavbar;
