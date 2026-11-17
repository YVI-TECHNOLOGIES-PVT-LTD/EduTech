import React, { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getInitials, cn } from '@/lib/utils';
import { useParentSelectedChild } from '@/modules/parent/hooks/useParentSelectedChild';
import { ParentChildDto } from '@/shared/api/parentPortal.api';
import { Check, ChevronDown, Users } from 'lucide-react';

const formatGradeSection = (child: ParentChildDto): string => {
  const enr = child.current_enrollment;
  if (!enr) {
    return child.admission_no ? `ADM: ${child.admission_no}` : 'Enrolled';
  }
  const grade = enr.grade_name?.trim() || '';
  const section = enr.section_name?.trim() || '';
  if (grade && section) {
    return `${grade} - ${section}`;
  }
  return grade || (child.admission_no ? `ADM: ${child.admission_no}` : 'Enrolled');
};

const getChildPhotoUrl = (child?: ParentChildDto | null): string | undefined => {
  if (!child) return undefined;
  return (
    child.photo_url ||
    (child as any)?.avatar_url ||
    (child as any)?.avatarUrl ||
    (child as any)?.profileImage?.url ||
    undefined
  );
};

export const ParentChildTopbarSelector: React.FC = () => {
  const { children, selectedChildId, selectChild, isLoading } = useParentSelectedChild();

  const activeChild = useMemo<ParentChildDto | null>(() => {
    if (!children || children.length === 0) return null;
    return children.find((c) => c.student_id === selectedChildId) || children[0];
  }, [children, selectedChildId]);

  // Desktop visible child slice (prevents topbar overflow for parents with >3 children)
  const visibleChildren = useMemo<ParentChildDto[]>(() => {
    if (!children || children.length <= 3) return children || [];
    if (!activeChild) return children.slice(0, 2);
    const others = children.filter((c) => c.student_id !== activeChild.student_id);
    return [activeChild, ...others.slice(0, 1)];
  }, [children, activeChild]);

  // Overflow children for dropdown when >3 children exist
  const overflowChildren = useMemo<ParentChildDto[]>(() => {
    if (!children || children.length <= 3) return [];
    const visibleIds = new Set(visibleChildren.map((c) => c.student_id));
    return children.filter((c) => !visibleIds.has(c.student_id));
  }, [children, visibleChildren]);

  if (isLoading && (!children || children.length === 0)) {
    return (
      <div className="flex items-center gap-2 px-1" aria-busy="true">
        <div className="h-[46px] sm:h-[48px] lg:h-[50px] w-[140px] sm:w-[155px] lg:w-[165px] rounded-[13px] border border-border/50 bg-muted/40 animate-pulse flex items-center gap-2.5 px-2.5">
          <div className="w-[32px] h-[32px] sm:w-[34px] sm:h-[34px] rounded-full bg-muted/70 shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="h-2.5 w-16 bg-muted/60 rounded" />
            <div className="h-2 w-10 bg-muted/40 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!children || children.length === 0) {
    return null;
  }

  // Single Child Context: Display the verified child rectangular badge without switching controls
  if (children.length === 1) {
    const child = children[0];
    const tooltipText = `${child.full_name}${
      child.current_enrollment
        ? ` • Grade ${child.current_enrollment.grade_name}${child.current_enrollment.section_name ? ` (${child.current_enrollment.section_name})` : ''}`
        : ''
    }${child.admission_no ? ` • ${child.admission_no}` : ''} • Verified Active Student`;

    return (
      <div
        className="flex items-center px-0.5 sm:px-1"
        data-testid="parent-single-child-indicator"
        title={tooltipText}
      >
        <div className="group flex items-center gap-2 sm:gap-2.5 h-[46px] sm:h-[48px] lg:h-[50px] w-[140px] sm:w-[155px] lg:w-[165px] px-2 sm:px-2.5 rounded-[13px] border border-primary/50 bg-blue-50/70 dark:bg-primary/15 text-left select-none shadow-2xs">
          {/* Small circular profile photograph inside rectangular selector */}
          <div className="relative w-[32px] h-[32px] sm:w-[34px] sm:h-[34px] lg:w-[36px] lg:h-[36px] rounded-full shrink-0">
            <Avatar className="w-full h-full rounded-full ring-2 ring-primary ring-offset-1 ring-offset-background">
              {getChildPhotoUrl(child) && (
                <AvatarImage
                  src={getChildPhotoUrl(child)}
                  alt={child.full_name}
                  className="w-full h-full object-cover rounded-full"
                />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] sm:text-xs font-black">
                {getInitials(child.full_name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Student name and grade/section */}
          <div className="flex flex-col min-w-0 flex-1 leading-tight">
            <span className="text-xs font-extrabold text-foreground truncate">
              {child.full_name}
            </span>
            <span className="text-[10px] text-primary dark:text-primary-foreground/80 font-medium truncate mt-0.5">
              {formatGradeSection(child)}
            </span>
          </div>

          {/* Active indicator */}
          <div
            className="w-4 h-4 rounded-full bg-primary/20 dark:bg-primary/30 text-primary flex items-center justify-center shrink-0 ml-auto"
            title="Verified Active Student"
          >
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        </div>
      </div>
    );
  }

  // Multi-Child Context
  return (
    <div data-testid="parent-child-topbar-selector" className="flex items-center">
      {/* ── MOBILE VIEW (< md): Compact active selector triggering full child switcher popover ── */}
      <div className="flex md:hidden">
        {activeChild && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Current child: ${activeChild.full_name}. Tap to switch child`}
              className="flex items-center gap-2 h-[42px] sm:h-[44px] max-w-[145px] sm:max-w-[165px] px-2 rounded-[12px] border border-primary/50 bg-blue-50/70 dark:bg-primary/15 text-left cursor-pointer shadow-2xs transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="relative w-[28px] h-[28px] rounded-full shrink-0">
                <Avatar className="w-full h-full rounded-full ring-1.5 ring-primary ring-offset-1 ring-offset-background">
                  {getChildPhotoUrl(activeChild) && (
                    <AvatarImage
                      src={getChildPhotoUrl(activeChild)}
                      alt={activeChild.full_name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-black">
                    {getInitials(activeChild.full_name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex flex-col min-w-0 flex-1 leading-tight">
                <span className="text-xs font-bold text-foreground truncate">
                  {activeChild.first_name || activeChild.full_name.split(' ')[0]}
                </span>
                <span className="text-[9px] text-primary dark:text-primary-foreground/80 font-medium truncate">
                  {formatGradeSection(activeChild)}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-0.5" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              className="w-64 rounded-[14px] border border-border/80 p-1.5 shadow-2xl bg-popover/95 backdrop-blur-2xl text-popover-foreground animate-in fade-in-50 zoom-in-95 duration-150"
            >
              <DropdownMenuLabel className="px-2.5 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Switch Student</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {children.length} Linked Children
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/60 my-1" />
              {children.map((child: ParentChildDto) => {
                const isSelected = child.student_id === selectedChildId;
                return (
                  <DropdownMenuItem
                    key={child.student_id}
                    onClick={() => selectChild(child.student_id)}
                    className={cn(
                      'flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'hover:bg-muted/80 text-foreground',
                    )}
                  >
                    <Avatar className="w-8 h-8 rounded-full border border-border shrink-0">
                      {getChildPhotoUrl(child) && (
                        <AvatarImage
                          src={getChildPhotoUrl(child)}
                          alt={child.full_name}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                        {getInitials(child.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 flex-1 leading-tight">
                      <span className="text-xs font-bold truncate text-foreground">
                        {child.full_name}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {formatGradeSection(child)}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary shrink-0 ml-auto stroke-[2.5]" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* ── DESKTOP VIEW (>= md): Rounded Rectangular Selectors displayed horizontally ── */}
      <nav
        aria-label="Parent Portal Child Switcher"
        className="hidden md:flex items-center gap-2 lg:gap-2.5"
      >
        {visibleChildren.map((child: ParentChildDto) => {
          const isSelected = child.student_id === selectedChildId;
          const tooltipText = `${child.full_name}${
            child.current_enrollment
              ? ` • Grade ${child.current_enrollment.grade_name}${child.current_enrollment.section_name ? ` (${child.current_enrollment.section_name})` : ''}`
              : ''
          }${child.admission_no ? ` • ${child.admission_no}` : ''}${
            isSelected ? ' (Currently Active)' : ' • Click to switch'
          }`;

          return (
            <button
              key={child.student_id}
              type="button"
              onClick={() => selectChild(child.student_id)}
              aria-pressed={isSelected}
              aria-label={`Switch active child to ${child.full_name}`}
              title={tooltipText}
              className={cn(
                'group flex items-center gap-2 sm:gap-2.5 h-[46px] sm:h-[48px] lg:h-[50px] w-[140px] md:w-[150px] lg:w-[165px] px-2 sm:px-2.5 rounded-[13px] border text-left transition-all duration-200 cursor-pointer select-none shrink-0 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isSelected
                  ? 'border-primary bg-blue-50/70 dark:bg-primary/15 text-foreground shadow-xs ring-1 ring-primary/25'
                  : 'border-border/70 bg-card/70 hover:bg-muted/70 dark:bg-card/40 dark:hover:bg-muted/40 text-muted-foreground hover:text-foreground hover:border-border hover:shadow-2xs',
              )}
            >
              {/* Small circular profile image inside rectangular selector */}
              <div className="relative w-[32px] h-[32px] sm:w-[34px] sm:h-[34px] lg:w-[36px] lg:h-[36px] rounded-full shrink-0">
                <Avatar
                  className={cn(
                    'w-full h-full rounded-full transition-all duration-200',
                    isSelected
                      ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                      : 'ring-1 ring-border/80 group-hover:ring-border',
                  )}
                >
                  {getChildPhotoUrl(child) && (
                    <AvatarImage
                      src={getChildPhotoUrl(child)}
                      alt={child.full_name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  )}
                  <AvatarFallback
                    className={cn(
                      'text-[10px] sm:text-xs font-black transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
                    )}
                  >
                    {getInitials(child.full_name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Student Name & Grade/Section */}
              <div className="flex flex-col min-w-0 flex-1 leading-tight">
                <span
                  className={cn(
                    'text-xs truncate transition-colors',
                    isSelected
                      ? 'font-black text-foreground'
                      : 'font-semibold text-foreground/80 group-hover:text-foreground',
                  )}
                >
                  {child.full_name}
                </span>
                <span
                  className={cn(
                    'text-[10px] truncate mt-0.5 transition-colors',
                    isSelected
                      ? 'text-primary dark:text-primary-foreground/80 font-medium'
                      : 'text-muted-foreground group-hover:text-foreground/70',
                  )}
                >
                  {formatGradeSection(child)}
                </span>
              </div>

              {/* Active Indicator Check Icon */}
              {isSelected && (
                <div className="w-4 h-4 rounded-full bg-primary/20 dark:bg-primary/30 text-primary flex items-center justify-center shrink-0 ml-auto animate-in zoom-in-75 duration-150">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}

        {/* Overflow Menu for Additional Children */}
        {overflowChildren.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`View ${overflowChildren.length} more linked children`}
              className="h-[46px] sm:h-[48px] lg:h-[50px] px-2.5 rounded-[13px] border border-border/70 bg-card/70 hover:bg-muted/70 dark:bg-card/40 dark:hover:bg-muted/40 text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-2xs shrink-0 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span>+{overflowChildren.length} More</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-64 rounded-[14px] border border-border/80 p-1.5 shadow-2xl bg-popover/95 backdrop-blur-2xl text-popover-foreground animate-in fade-in-50 zoom-in-95 duration-150"
            >
              <DropdownMenuLabel className="px-2.5 py-1.5">
                <span className="text-xs font-bold text-foreground">Other Linked Children</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/60 my-1" />
              {overflowChildren.map((child: ParentChildDto) => (
                <DropdownMenuItem
                  key={child.student_id}
                  onClick={() => selectChild(child.student_id)}
                  className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-muted/80 text-foreground transition-colors"
                >
                  <Avatar className="w-8 h-8 rounded-full border border-border shrink-0">
                    {getChildPhotoUrl(child) && (
                      <AvatarImage
                        src={getChildPhotoUrl(child)}
                        alt={child.full_name}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                      {getInitials(child.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1 leading-tight">
                    <span className="text-xs font-bold truncate text-foreground">
                      {child.full_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {formatGradeSection(child)}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </nav>
    </div>
  );
};

export default ParentChildTopbarSelector;
