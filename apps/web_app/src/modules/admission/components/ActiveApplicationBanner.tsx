import React from 'react';
import {
  GraduationCap,
  CalendarDays,
  Users,
  ChevronDown,
} from 'lucide-react';
import { formatStatusLabel, getStatusColor } from '../core/AdmissionStatusMapper';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import type { ApplicationRecord } from '@/shared/api/admission.api';

export interface ActiveApplicationBannerProps {
  activeApplication: ApplicationRecord | null;
  applications: ApplicationRecord[];
  activeApplicationId: string;
  setActiveApplicationId: (appId: string) => void;
  hasMultiple: boolean;
  studentName: string;
  appNumber: string;
  gradeApplied: string;
}

export const ActiveApplicationBanner: React.FC<ActiveApplicationBannerProps> = ({
  activeApplication,
  applications,
  activeApplicationId,
  setActiveApplicationId,
  hasMultiple,
  studentName,
  appNumber,
  gradeApplied,
}) => {
  if (!activeApplication) return null;

  const appStatus = activeApplication.status || 'submitted';
  const submittedDate =
    activeApplication.application_date ||
    activeApplication.submitted_at ||
    activeApplication.created_at
      ? new Date(
          activeApplication.application_date ||
            activeApplication.submitted_at ||
            activeApplication.created_at!,
        ).toLocaleDateString()
      : 'Recently';

  const photoUrl =
    (activeApplication as any)?.photo_url ||
    (activeApplication as any)?.student_photo_url ||
    (activeApplication?.lead as any)?.photo_url ||
    (activeApplication as any)?.leads?.photo_url;

  return (
    <Card className="p-4 sm:p-5 rounded-2xl border-border/80 bg-card shadow-xs">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Child & Application Meta */}
        <div className="flex items-center space-x-3.5 min-w-0">
          <Avatar size="default" className="border border-border/80 shrink-0">
            <AvatarImage src={photoUrl} alt={studentName} />
            <AvatarFallback className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              {getInitials(studentName, 'A')}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                {studentName}
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] font-bold font-mono tracking-wider text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800"
              >
                {appNumber}
              </Badge>
              <span
                className={`px-2.5 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wider ${getStatusColor(
                  appStatus,
                )}`}
              >
                {formatStatusLabel(appStatus)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center space-x-1 font-semibold">
                <GraduationCap className="w-3.5 h-3.5 text-muted-foreground/70" />
                <span>Grade: {gradeApplied}</span>
              </span>
              <span className="flex items-center space-x-1 font-semibold">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground/70" />
                <span>Submitted: {submittedDate}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Child Selector (if multiple applications exist) */}
        {hasMultiple ? (
          <div className="flex items-center space-x-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-border/60">
            <div className="flex items-center space-x-1.5 text-xs text-muted-foreground font-bold shrink-0">
              <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Switch Child:</span>
            </div>
            <div className="relative">
              <select
                value={activeApplicationId}
                onChange={(e) => setActiveApplicationId(e.target.value)}
                aria-label="Select Active Admission Application"
                className="bg-muted/50 hover:bg-muted text-foreground text-xs font-bold pl-3 pr-8 py-1.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none min-w-[180px]"
              >
                {applications.map((app) => {
                  const name =
                    app.student_name ||
                    (app.leads
                      ? `${app.leads.student_first_name || ''} ${app.leads.student_last_name || ''}`.trim()
                      : app.lead
                        ? `${app.lead.student_first_name || ''} ${app.lead.student_last_name || ''}`.trim()
                        : 'Applicant');
                  const num =
                    app.application_number ||
                    app.applicationNumber ||
                    app.application_id?.slice(0, 8);
                  const id = app.application_id || app.id;
                  return (
                    <option key={id} value={id}>
                      {name} ({num})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Active Application Context</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ActiveApplicationBanner;
