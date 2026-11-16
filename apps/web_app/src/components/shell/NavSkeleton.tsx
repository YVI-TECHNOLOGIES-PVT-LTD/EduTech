import React from 'react';
import { cn } from '@/lib/utils';

export interface NavSkeletonProps {
  className?: string;
}

/**
 * SidebarSkeleton
 * Matches the exact geometry of AppSidebar (w-[var(--sidebar-width)] h-svh)
 * Displays during genuine initial navigation/auth resolution to avoid layout shifts.
 */
export const SidebarSkeleton: React.FC<NavSkeletonProps> = ({ className }) => {
  return (
    <aside
      aria-label="Loading navigation"
      className={cn(
        'hidden md:flex flex-col h-svh w-[var(--sidebar-width)] bg-sidebar/85 backdrop-blur-xl border-r border-sidebar-border z-20 shrink-0 select-none overflow-hidden',
        className,
      )}
    >
      {/* 1. Brand Header (h-16) */}
      <div className="h-16 px-3.5 border-b border-sidebar-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-muted/60 animate-nav-shimmer shrink-0" />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-20 h-4 rounded-md bg-muted/60 animate-nav-shimmer" />
              <div className="w-8 h-3.5 rounded-md bg-muted/50 animate-nav-shimmer" />
            </div>
            <div className="w-24 h-2.5 rounded-sm bg-muted/40 animate-nav-shimmer" />
          </div>
        </div>
      </div>

      {/* 2. Structured Nav Groups */}
      <div className="flex-1 p-2 space-y-4 overflow-hidden">
        {[1, 2, 3].map((groupIndex) => (
          <div key={groupIndex} className="space-y-1.5">
            {/* Group Label */}
            <div className="px-3 py-1">
              <div className="w-20 h-2.5 rounded-sm bg-muted/40 animate-nav-shimmer" />
            </div>
            {/* Nav Items */}
            <div className="space-y-1">
              {Array.from({ length: groupIndex === 1 ? 4 : 3 }).map((_, itemIndex) => (
                <div
                  key={itemIndex}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] min-h-[38px] bg-muted/20"
                >
                  <div className="w-4 h-4 rounded-md bg-muted/60 animate-nav-shimmer shrink-0" />
                  <div
                    className={cn(
                      'h-3.5 rounded-md bg-muted/50 animate-nav-shimmer',
                      itemIndex % 2 === 0 ? 'w-28' : 'w-20',
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Footer Profile */}
      <div className="p-2 border-t border-sidebar-border shrink-0">
        <div className="flex items-center gap-3 p-2 rounded-[14px] bg-muted/20">
          <div className="w-8 h-8 rounded-full bg-muted/60 animate-nav-shimmer shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="w-24 h-3 rounded-md bg-muted/60 animate-nav-shimmer" />
            <div className="w-16 h-2 rounded-sm bg-muted/40 animate-nav-shimmer" />
          </div>
        </div>
      </div>
    </aside>
  );
};

/**
 * TopbarSkeleton
 * Matches the exact geometry of AppNavbar (h-16)
 * Displays during genuine initial navigation/auth resolution to avoid layout shifts.
 */
export const TopbarSkeleton: React.FC<NavSkeletonProps> = ({ className }) => {
  return (
    <header
      aria-label="Loading topbar"
      className={cn(
        'h-16 bg-card/85 backdrop-blur-xl border-b border-border sticky top-0 z-20 shadow-2xs select-none',
        className,
      )}
    >
      <div className="h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Sidebar trigger & Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-muted/50 animate-nav-shimmer shrink-0" />
          <div className="h-5 w-px bg-border/60 hidden sm:block shrink-0" />
          {/* Breadcrumb placeholders */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-16 h-4 rounded-lg bg-muted/40 animate-nav-shimmer" />
            <div className="w-2 h-2 rounded-full bg-muted/30" />
            <div className="w-24 h-5 rounded-lg bg-muted/60 animate-nav-shimmer" />
          </div>
          {/* Mobile title placeholder */}
          <div className="flex md:hidden">
            <div className="w-28 h-4 rounded-lg bg-muted/60 animate-nav-shimmer" />
          </div>
        </div>

        {/* Right: Search, Language, Theme, Notification, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Desktop Search */}
          <div className="hidden sm:flex items-center justify-between w-44 md:w-56 lg:w-64 h-9 px-3 rounded-xl bg-muted/30 border border-border/60 animate-nav-shimmer">
            <div className="w-28 h-3 rounded bg-muted/50" />
            <div className="w-7 h-4 rounded bg-muted/40" />
          </div>
          {/* Mobile Search */}
          <div className="sm:hidden w-9 h-9 rounded-lg bg-muted/40 animate-nav-shimmer" />

          {/* Language toggle placeholder */}
          <div className="w-9 h-9 rounded-lg bg-muted/40 animate-nav-shimmer shrink-0" />

          {/* Theme toggle placeholder */}
          <div className="w-9 h-9 rounded-lg bg-muted/40 animate-nav-shimmer shrink-0" />

          {/* Notification bell placeholder */}
          <div className="w-9 h-9 rounded-lg bg-muted/40 animate-nav-shimmer shrink-0" />

          <div className="h-6 w-px bg-border/60 hidden sm:block shrink-0" />

          {/* User profile avatar placeholder */}
          <div className="flex items-center gap-2 p-1">
            <div className="w-8 h-8 rounded-full bg-muted/60 animate-nav-shimmer shrink-0" />
            <div className="hidden sm:flex flex-col gap-1">
              <div className="w-20 h-3 rounded bg-muted/60 animate-nav-shimmer" />
              <div className="w-12 h-2 rounded bg-muted/40 animate-nav-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
