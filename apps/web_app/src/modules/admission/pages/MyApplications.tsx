import React from 'react';
import {
  Plus,
  ChevronRight,
  FileText,
  Calendar,
  GraduationCap,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useApplicationList } from '../hooks/useApplication';
import { formatStatusLabel, getStatusColor } from '../core/AdmissionStatusMapper';
import {
  PageContainer,
  PageHeader,
  SectionHeader,
  EmptyState,
} from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { ApplicationRecord } from '@/shared/api/admission.api';

export function MyApplications() {
  const navigate = useNavigate();
  const {
    applications = [],
    isLoading,
    error,
    refetch,
  } = useApplicationList({ limit: 50 }, { mine: true });

  if (isLoading) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-muted-foreground">
            Loading your admission applications...
          </p>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Failed to load applications</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Unable to retrieve your admission applications. Please try again.
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="font-bold text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="default">
      {/* Canonical Page Header */}
      <PageHeader
        title="My Admission Applications"
        description="Track evaluation status, submitted certificates, and processing fee clearance for your children."
        badge={
          <Badge
            variant="outline"
            className="text-[10px] font-black uppercase tracking-wider text-indigo-600 border-indigo-200"
          >
            Admission Self-Service
          </Badge>
        }
        actions={
          <Button
            onClick={() => navigate('/app/admissions/wizard')}
            className="font-bold text-xs shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Start New Application
          </Button>
        }
      />

      {/* Applications List or Empty State */}
      {applications.length === 0 ? (
        <EmptyState
          title="No Admission Applications Yet"
          description="Start your child's enrollment process by completing an online admission application."
          action={
            <Button
              onClick={() => navigate('/app/admissions/wizard')}
              className="font-bold text-xs px-6 shadow-md"
            >
              Start New Application
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <SectionHeader
            title={`Your Registered Applications (${applications.length})`}
            action={
              <button
                type="button"
                onClick={() => refetch()}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Status</span>
              </button>
            }
          />

          <div className="grid gap-4">
            {applications.map((app: ApplicationRecord) => {
              const studentName =
                app.student_name ||
                (app.leads
                  ? `${app.leads.student_first_name || ''} ${app.leads.student_last_name || ''}`.trim()
                  : 'Applicant');
              const gradeApplied =
                app.grade_applied_for ||
                app.leads?.academic_year_grades?.grades?.grade_name ||
                'Grade Applied';
              const appNumber =
                app.application_number ||
                app.applicationNumber ||
                `APP-${app.application_id?.slice(0, 8) || '2026'}`;
              const appStatus = app.status || 'submitted';

              return (
                <Card
                  key={app.application_id || app.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-2xl flex items-center justify-center font-black text-lg border border-indigo-200/80 dark:border-indigo-800 shrink-0">
                      {studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground text-base">{studentName}</h3>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold font-mono tracking-wider text-indigo-600 bg-indigo-50/50 border-indigo-200"
                        >
                          {appNumber}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 font-medium">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-muted-foreground/70" /> Grade:{' '}
                          {gradeApplied}
                        </span>
                        {app.application_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" /> Submitted:{' '}
                            {new Date(app.application_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
                    <span
                      className={`px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${getStatusColor(appStatus)}`}
                    >
                      {formatStatusLabel(appStatus)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link to={`/app/admissions/${app.application_id || app.id}`}>
                        <Button
                          size="sm"
                          className="font-bold text-xs flex items-center gap-1.5 shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Application</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default MyApplications;
