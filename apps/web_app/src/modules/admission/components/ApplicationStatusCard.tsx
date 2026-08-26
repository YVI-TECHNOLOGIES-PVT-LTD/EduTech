import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ArrowRight,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  formatStatusLabel,
  getStatusColor,
  getApplicationStatusSummary,
} from '../core/AdmissionStatusMapper';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

export interface ApplicationStatusCardProps {
  application: any;
}

export const ApplicationStatusCard: React.FC<ApplicationStatusCardProps> = ({ application }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const rawRoles = user?.roles || ((user as any)?.role ? [(user as any).role] : []);
  const normalizedRoles = rawRoles.map((r: string) =>
    String(r)
      .toUpperCase()
      .replace(/[\s_-]+/g, '_'),
  );

  const isStaff = normalizedRoles.some((r: string) =>
    [
      'ADMIN',
      'SUPERADMIN',
      'SUPER_ADMIN',
      'ORG_ADMIN',
      'FRONT_OFFICE',
      'FO',
      'FRONT_OFFICE_STAFF',
      'RECEPTIONIST',
      'STAFF',
      'FACULTY',
      'ADMISSION_OFFICER',
      'ADMISSIONS_OFFICER',
      'COUNSELLOR',
      'COUNSELOR',
      'HOI',
      'PRINCIPAL',
      'HEAD_OF_INSTITUTE',
      'TEACHER',
      'FINANCE',
      'FINANCE_OFFICER',
      'EXAM_CELL_ADMIN',
      'EXAM_CELL',
    ].includes(r),
  );

  const appId = application.application_id || application.id;

  const studentName =
    application.student_name ||
    (application.leads
      ? `${application.leads.student_first_name || ''} ${application.leads.student_last_name || ''}`.trim()
      : application.lead
        ? `${application.lead.student_first_name || ''} ${application.lead.student_last_name || ''}`.trim()
        : 'Applicant');

  const displayName = studentName || 'Applicant';

  const parentName =
    application.parent_name ||
    application.parentName ||
    application.leads?.contact_name ||
    application.lead?.contact_name ||
    (application.applicant?.full_name && application.applicant.full_name !== displayName
      ? application.applicant.full_name
      : null);

  const gradeApplied =
    application.grade_applied_for ||
    application.grade_name ||
    application.lead?.grade_applied_for ||
    application.leads?.academic_year_grades?.grades?.grade_name ||
    'Grade Applied';

  const appNumber =
    application.application_number ||
    application.applicationNumber ||
    (appId ? `APP-${appId.slice(0, 8).toUpperCase()}` : '');

  const appStatus = application.status || 'submitted';

  const submittedDate =
    application.application_date || application.submitted_at || application.created_at
      ? new Date(
          application.application_date || application.submitted_at || application.created_at,
        ).toLocaleDateString()
      : 'Recently';

  const summary = getApplicationStatusSummary(application);

  const renderStatusIcon = (iconName: string) => {
    switch (iconName) {
      case 'check':
        return <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />;
      case 'alert':
        return <AlertCircle className="w-3.5 h-3.5 shrink-0" />;
      default:
        return <Clock className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  const getVariantClasses = (variant: string) => {
    switch (variant) {
      case 'success':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'destructive':
        return 'text-rose-600 dark:text-rose-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'info':
        return 'text-indigo-600 dark:text-indigo-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const handleViewApplication = () => {
    if (isStaff) {
      navigate(`/app/admissions/application/${appId}`);
    } else {
      navigate(`/app/admissions/status?appId=${appId}`);
    }
  };

  return (
    <Card className="p-6 rounded-2xl border-border/80 shadow-sm hover:shadow-md transition-shadow space-y-5 bg-card">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Avatar size="lg" className="border border-border/80 shrink-0">
            <AvatarImage
              src={
                application.photo_url ||
                application.student_photo_url ||
                application.lead?.photo_url
              }
              alt={displayName}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
              {getInitials(displayName, 'A')}
            </AvatarFallback>
          </Avatar>
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
              {isStaff && parentName && (
                <span className="flex items-center space-x-1 font-semibold">
                  <User className="w-3.5 h-3.5 text-muted-foreground/70" />
                  <span>Parent: {parentName}</span>
                </span>
              )}
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

      {/* Dynamic Progress Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-center space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            FORM
          </span>
          <span
            className={`text-xs font-extrabold flex items-center justify-center gap-1 ${getVariantClasses(summary.form.variant)}`}
          >
            {renderStatusIcon(summary.form.iconName)}
            <span>{summary.form.label}</span>
          </span>
        </div>

        <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-center space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            DOCUMENTS
          </span>
          <span
            className={`text-xs font-extrabold flex items-center justify-center gap-1 ${getVariantClasses(summary.documents.variant)}`}
          >
            {renderStatusIcon(summary.documents.iconName)}
            <span className="truncate">{summary.documents.label}</span>
          </span>
        </div>

        <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-center space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            PAYMENT
          </span>
          <span
            className={`text-xs font-extrabold flex items-center justify-center gap-1 ${getVariantClasses(summary.payment.variant)}`}
          >
            {renderStatusIcon(summary.payment.iconName)}
            <span>{summary.payment.label}</span>
          </span>
        </div>

        <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-center space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            EVALUATION
          </span>
          <span
            className={`text-xs font-extrabold flex items-center justify-center gap-1 truncate px-1 ${getVariantClasses(summary.evaluation.variant)}`}
          >
            {renderStatusIcon(summary.evaluation.iconName)}
            <span className="truncate">{summary.evaluation.label}</span>
          </span>
        </div>
      </div>

      <div className="border-t border-border/60" />

      {/* Card Action Area */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-1">
        <Button
          size="sm"
          onClick={handleViewApplication}
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
