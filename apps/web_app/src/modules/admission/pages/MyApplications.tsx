import React from 'react';
import { Plus, ChevronRight, FileText, Calendar, GraduationCap } from 'lucide-react';
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

export function MyApplications() {
  const navigate = useNavigate();
  const { applications, isLoading, refetch } = useApplicationList({ limit: 50 }, { mine: true });

  if (isLoading) {
    return (
      <PageContainer variant="default">
        <div className="p-12 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-500">
            Loading your admission applications...
          </p>
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
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600">
            Parent Self-Service
          </span>
        }
        actions={
          <Button
            onClick={() => navigate('/app/admissions/wizard')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs"
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs px-6"
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
                onClick={() => refetch()}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                Refresh Status
              </button>
            }
          />

          <div className="grid gap-4">
            {applications.map((app: any) => {
              const studentName =
                app.student_name ||
                (app.leads
                  ? `${app.leads.student_first_name || ''} ${app.leads.student_last_name || ''}`
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
                <div
                  key={app.application_id || app.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center font-black text-lg border border-indigo-100 shrink-0">
                      {studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base">{studentName}</h3>
                        <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {appNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-gray-400" /> Grade:{' '}
                          {gradeApplied}
                        </span>
                        {app.application_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" /> Submitted:{' '}
                            {new Date(app.application_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                    <span
                      className={`px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${getStatusColor(appStatus)}`}
                    >
                      {formatStatusLabel(appStatus)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/app/admissions/${app.application_id || app.id}`}
                        className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        View Status <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default MyApplications;
