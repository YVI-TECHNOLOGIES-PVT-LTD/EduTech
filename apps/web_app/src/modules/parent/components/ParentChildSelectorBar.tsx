import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials, cn } from '@/lib/utils';
import { ParentChildDto } from '@/shared/api/parentPortal.api';
import { Users, GraduationCap, UserCheck } from 'lucide-react';

interface ParentChildSelectorBarProps {
  childrenList: ParentChildDto[];
  selectedChildId: string | null;
  onSelectChild: (childId: string) => void;
  title?: string;
}

export const ParentChildSelectorBar: React.FC<ParentChildSelectorBarProps> = ({
  childrenList,
  selectedChildId,
  onSelectChild,
  title = 'Active Child Context',
}) => {
  if (!childrenList || childrenList.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="parent-child-selector"
      className="bg-white dark:bg-card border border-slate-200/80 dark:border-border rounded-2xl p-3 sm:p-4 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Users className="w-4 h-4 text-primary" />
          <span>{title}</span>
          <Badge variant="secondary" className="text-[10px] font-bold">
            {childrenList.length} {childrenList.length === 1 ? 'Child' : 'Children'}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {childrenList.map((child) => {
            const isSelected = child.student_id === selectedChildId;
            const enr = child.current_enrollment;
            return (
              <button
                key={child.student_id}
                type="button"
                onClick={() => onSelectChild(child.student_id)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted/30 hover:bg-muted text-foreground border-border/80',
                )}
              >
                <Avatar className="w-7 h-7 border border-white/30 shrink-0">
                  {child.photo_url && <AvatarImage src={child.photo_url} alt={child.full_name} />}
                  <AvatarFallback
                    className={cn(
                      'text-[10px] font-bold',
                      isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary',
                    )}
                  >
                    {getInitials(child.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate max-w-[160px]">{child.full_name}</div>
                  <div
                    className={cn(
                      'text-[10px] flex items-center gap-1 truncate max-w-[180px]',
                      isSelected ? 'text-primary-foreground/85' : 'text-muted-foreground',
                    )}
                  >
                    <GraduationCap className="w-3 h-3 shrink-0" />
                    <span>
                      {enr
                        ? `${enr.grade_name}${enr.section_name ? ` • Sec ${enr.section_name}` : ''}`
                        : 'Placement Pending'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {(() => {
        const active = childrenList.find((c) => c.student_id === selectedChildId);
        const enr = active?.current_enrollment;
        if (!active || !enr) return null;
        return (
          <div className="mt-3 pt-2.5 border-t border-border/60 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
            <span>
              <strong className="text-foreground">Academic Year:</strong> {enr.academic_year_name}
            </span>
            {enr.roll_number && (
              <span>
                <strong className="text-foreground">Roll No:</strong> {enr.roll_number}
              </span>
            )}
            {enr.class_teacher && (
              <span className="inline-flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <strong className="text-foreground">Class Teacher:</strong> {enr.class_teacher.name}
              </span>
            )}
            {enr.section_room_no && (
              <span>
                <strong className="text-foreground">Homeroom:</strong> {enr.section_room_no}
              </span>
            )}
          </div>
        );
      })()}
    </div>
  );
};
