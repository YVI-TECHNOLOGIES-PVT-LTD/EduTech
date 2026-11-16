import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  AttendanceStatsSummaryDto,
  ClassroomAttendanceStatus,
  ClassroomDeliveryMode,
  ClassroomParticipationMode,
  ClassroomSessionStatus,
  ClassroomTeachingApproach,
} from '@/shared/api/classroom.api';
import {
  Building2,
  CheckCircle2,
  Clock,
  Globe,
  Layers,
  Radio,
  Sparkles,
  UserCheck,
  UserX,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const SessionStatusBadge: React.FC<{ status: ClassroomSessionStatus }> = ({ status }) => {
  switch (status) {
    case 'in_progress':
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300 dark:text-emerald-300 font-semibold gap-1.5">
          <Radio className="w-3 h-3 animate-pulse" />
          Live Now
        </Badge>
      );
    case 'scheduled':
      return (
        <Badge className="bg-sky-500/15 text-sky-700 border-sky-300 dark:text-sky-300 font-semibold gap-1">
          <Clock className="w-3 h-3" />
          Scheduled
        </Badge>
      );
    case 'completed':
      return (
        <Badge className="bg-indigo-500/15 text-indigo-700 border-indigo-300 dark:text-indigo-300 font-semibold gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </Badge>
      );
    case 'not_conducted':
      return (
        <Badge className="bg-amber-500/15 text-amber-800 border-amber-300 dark:text-amber-300 font-semibold gap-1">
          <Clock className="w-3 h-3" />
          Not Conducted
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge className="bg-rose-500/15 text-rose-700 border-rose-300 dark:text-rose-300 font-semibold gap-1">
          <XCircle className="w-3 h-3" />
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export const DeliveryModeBadge: React.FC<{ mode: ClassroomDeliveryMode }> = ({ mode }) => {
  switch (mode) {
    case 'physical':
      return (
        <Badge variant="outline" className="gap-1 bg-slate-50 dark:bg-muted font-medium">
          <Building2 className="w-3 h-3 text-slate-600" />
          Physical
        </Badge>
      );
    case 'online':
      return (
        <Badge
          variant="outline"
          className="gap-1 bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 font-medium"
        >
          <Globe className="w-3 h-3" />
          Online
        </Badge>
      );
    case 'hybrid':
      return (
        <Badge
          variant="outline"
          className="gap-1 bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300 font-medium"
        >
          <Layers className="w-3 h-3" />
          Hybrid
        </Badge>
      );
    default:
      return <Badge variant="outline">{mode}</Badge>;
  }
};

export const TeachingApproachBadge: React.FC<{ approach: ClassroomTeachingApproach }> = ({
  approach,
}) => {
  if (approach === 'flipped') {
    return (
      <Badge
        variant="outline"
        className="gap-1 bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950/30 dark:text-fuchsia-300"
      >
        <Sparkles className="w-3 h-3" />
        Flipped Classroom
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      Traditional
    </Badge>
  );
};

export const AttendanceStatusBadge: React.FC<{
  status: ClassroomAttendanceStatus | null;
  participationMode?: ClassroomParticipationMode | null;
}> = ({ status, participationMode }) => {
  if (!status) {
    return (
      <Badge variant="outline" className="text-muted-foreground border-dashed">
        Unmarked
      </Badge>
    );
  }

  const labels: Record<ClassroomAttendanceStatus, { text: string; className: string; icon: any }> =
    {
      present: {
        text: 'Present',
        className: 'bg-emerald-500/15 text-emerald-700 border-emerald-300 dark:text-emerald-300',
        icon: UserCheck,
      },
      late: {
        text: 'Late',
        className: 'bg-amber-500/15 text-amber-800 border-amber-300 dark:text-amber-300',
        icon: Clock,
      },
      absent: {
        text: 'Absent',
        className: 'bg-rose-500/15 text-rose-700 border-rose-300 dark:text-rose-300',
        icon: UserX,
      },
      excused: {
        text: 'Excused',
        className: 'bg-slate-500/15 text-slate-700 border-slate-300 dark:text-slate-300',
        icon: CheckCircle2,
      },
    };

  const cfg = labels[status];
  const Icon = cfg.icon;
  return (
    <Badge className={cn('gap-1 font-semibold', cfg.className)}>
      <Icon className="w-3 h-3" />
      {cfg.text}
      {participationMode ? ` (${participationMode})` : ''}
    </Badge>
  );
};

export const AttendanceSummaryCards: React.FC<{
  summary: AttendanceStatsSummaryDto;
  titlePrefix?: string;
}> = ({ summary, titlePrefix }) => {
  const items = [
    {
      label: `${titlePrefix ? `${titlePrefix} ` : ''}Attendance Rate`,
      value: `${summary.attendance_percentage.toFixed(1)}%`,
      sub: `${summary.attended_count} of ${summary.marked_sessions} marked`,
      tone:
        summary.marked_sessions > 0 && summary.attendance_percentage < 75
          ? 'text-rose-600'
          : 'text-emerald-600',
    },
    {
      label: 'Present',
      value: String(summary.present_count),
      sub: 'On-time participation',
      tone: 'text-emerald-700',
    },
    {
      label: 'Late',
      value: String(summary.late_count),
      sub: 'Counted in attended',
      tone: 'text-amber-700',
    },
    {
      label: 'Absent / Excused',
      value: `${summary.absent_count} / ${summary.excused_count}`,
      sub: `${summary.total_sessions} total scheduled`,
      tone: 'text-slate-700 dark:text-slate-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.label} className="p-4 rounded-2xl border-slate-200/80 dark:border-border">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {item.label}
          </div>
          <div className={cn('text-2xl font-black mt-1', item.tone)}>{item.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{item.sub}</div>
        </Card>
      ))}
    </div>
  );
};
