import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { formatStatusLabel, getStatusColor } from '../core/AdmissionStatusMapper';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ApplicationStatusCardProps {
  application: any;
}

export const ApplicationStatusCard: React.FC<ApplicationStatusCardProps> = ({ application }) => {
  const navigate = useNavigate();

  const appId = application.application_id || application.id;

  const studentName =
    application.student_name ||
    (application.leads
      ? `${application.leads.student_first_name || ''} ${application.leads.student_last_name || ''}`.trim()
      : application.lead
        ? `${application.lead.student_first_name || ''} ${application.lead.student_last_name || ''}`.trim()
        : 'Applicant');

  const displayName = studentName || 'Applicant';

  const initials =
    displayName && displayName !== 'Applicant'
      ? displayName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part: string) => part.charAt(0).toUpperCase())
          .join('')
      : 'A';

  const gradeApplied =
    application.grade_applied_for ||
    application.lead?.grade_applied_for ||
    application.leads?.academic_year_grades?.grades?.grade_name ||
    'Grade Applied';

  const appNumber =
    application.application_number ||
    application.applicationNumber ||
    (appId ? `APP-${appId.slice(0, 8).toUpperCase()}` : 'APP-2026');

  const appStatus = application.status || 'submitted';

  const submittedDate =
    application.application_date || application.submitted_at || application.created_at
      ? new Date(
          application.application_date || application.submitted_at || application.created_at,
        ).toLocaleDateString()
      : 'Recently';

  return (
    <Card className="p-6 rounded-2xl border-border/80 shadow-sm hover:shadow-md transition-shadow space-y-5 bg-card">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-lg border border-indigo-200/80 dark:border-indigo-800 shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <h3 className="text-base font-bold text-foreground">{displayName}</h3>
              <Badge
                variant="outline"
                className="text-[10px] font-bold font-mono tracking-wider text-indigo-600 bg-indigo-50/50 border-indigo-200"
              >
                {appNumber}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-1">
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

        <div className="shrink-0 self-start sm:self-auto">
          <span
            className={`px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${getStatusColor(appStatus)}`}
          >
            {formatStatusLabel(appStatus)}
          </span>
        </div>
      </div>

      <div className="border-t border-border/60" />

      {/* Progress Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-center space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            FORM
          </span>
          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Submitted</span>
          </span>
        </div>

        <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-center space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            DOCUMENTS
          </span>
          <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {application.documents_count
                ? `${application.documents_count} Files`
                : 'Pending Check'}
            </span>
          </span>
        </div>

        <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-center space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            PAYMENT
          </span>
          <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{application.payment_status || 'Verified'}</span>
          </span>
        </div>

        <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-center space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            EVALUATION
          </span>
          <span className="text-xs font-extrabold text-foreground flex items-center justify-center gap-1 truncate px-1">
            <span>{formatStatusLabel(appStatus)}</span>
          </span>
        </div>
      </div>

      <div className="border-t border-border/60" />

      {/* Card Action Area */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-1">
        <Button
          size="sm"
          onClick={() => navigate(`/app/admissions/${appId}`)}
          className="w-full sm:w-auto font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>View Application</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5 opacity-80" />
        </Button>
      </div>
    </Card>
  );
};
