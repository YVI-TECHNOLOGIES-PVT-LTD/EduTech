import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  ChevronRight,
  FileText,
  Calendar,
  GraduationCap,
  FolderCheck,
  CreditCard,
  CheckCircle2,
  User,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApplicationList } from '../../hooks/useApplication';
import { formatStatusLabel, getStatusColor } from '../../core/AdmissionStatusMapper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const ParentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { applications, isLoading, error, refetch } = useApplicationList(
    { limit: 50 },
    { mine: true },
  );

  const rawName =
    user?.full_name ||
    (user as any)?.name ||
    ((user as any)?.firstName
      ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim()
      : '');
  const parentName =
    rawName ||
    (user?.email
      ? user.email
          .split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase())
      : 'Parent Guardian');

  if (isLoading) {
    return (
      <div className="p-8 sm:p-12 text-center space-y-4 max-w-4xl mx-auto">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
          Loading your parent dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="text-xs font-bold">
              Unable to load application status. Please try refreshing.
            </span>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="h-8 text-xs font-bold rounded-xl border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const primaryApp = applications.length > 0 ? applications[0] : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Welcome Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-indigo-950/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-2xl z-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-800/60 text-indigo-200 text-xs font-bold border border-indigo-700/50">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Parent Self-Service Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {parentName}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed font-medium">
            Monitor your child's enrollment progress, submit required documents, and track
            evaluation milestones.
          </p>
        </div>

        <div className="z-10 shrink-0 w-full md:w-auto">
          <Button
            onClick={() => navigate('/app/admissions/wizard')}
            className="w-full md:w-auto h-11 px-6 bg-white hover:bg-indigo-50 text-indigo-950 font-bold rounded-2xl shadow-lg flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Start New Application</span>
          </Button>
        </div>
      </div>

      {/* 2. Active Application Status Overview / Empty State */}
      {applications.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center rounded-3xl border-slate-200/80 shadow-xs max-w-xl mx-auto space-y-5">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-800">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              No Admission Applications Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Start your child's enrollment process by completing an online admission application.
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={() => navigate('/app/admissions/wizard')}
              className="w-full sm:w-auto px-8 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              Start New Application
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Active Application Status ({applications.length})
            </h2>
            <button
              onClick={() => refetch()}
              className="text-xs text-indigo-600 font-bold hover:underline flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Status</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {applications.map((app: any) => {
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
                  className="p-6 rounded-3xl border-slate-200/80 dark:border-border shadow-md shadow-slate-100 dark:shadow-none space-y-6"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-border pb-5">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-lg border border-indigo-100 dark:border-indigo-800 shrink-0">
                        {studentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2.5">
                          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                            {studentName}
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-[10px] font-black text-indigo-600 border-indigo-200"
                          >
                            {appNumber}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="flex items-center space-x-1 font-semibold">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            <span>Grade: {gradeApplied}</span>
                          </span>
                          {app.application_date && (
                            <span className="flex items-center space-x-1 font-semibold">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                Submitted: {new Date(app.application_date).toLocaleDateString()}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span
                        className={`px-3 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${getStatusColor(appStatus)}`}
                      >
                        {formatStatusLabel(appStatus)}
                      </span>
                      <Button
                        onClick={() => navigate('/app/admissions/wizard')}
                        className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-indigo-100 dark:shadow-none"
                      >
                        <span>Continue Application</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Workflow Milestones Progress Tracker */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 bg-slate-50 dark:bg-muted/40 rounded-2xl border border-slate-100 dark:border-border text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        1. Form
                      </span>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                        Submitted
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-muted/40 rounded-2xl border border-slate-100 dark:border-border text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        2. Documents
                      </span>
                      <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block">
                        {app.documents_count ? `${app.documents_count} Files` : 'Pending Check'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-muted/40 rounded-2xl border border-slate-100 dark:border-border text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        3. Payment
                      </span>
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                        {app.payment_status || 'Verified'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-muted/40 rounded-2xl border border-slate-100 dark:border-border text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        4. Evaluation
                      </span>
                      <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mt-0.5 block">
                        {formatStatusLabel(appStatus)}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Quick Action Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
          Quick Actions & Portals
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/app/admissions/my"
            className="p-5 bg-white dark:bg-card rounded-3xl border border-slate-200/80 dark:border-border hover:shadow-lg transition-all flex items-center space-x-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                My Applications
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                View all registered applications
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/app/admissions/documents"
            className="p-5 bg-white dark:bg-card rounded-3xl border border-slate-200/80 dark:border-border hover:shadow-lg transition-all flex items-center space-x-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
              <FolderCheck className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                Document Center
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Upload & verify birth/marksheets
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/app/admissions/fees"
            className="p-5 bg-white dark:bg-card rounded-3xl border border-slate-200/80 dark:border-border hover:shadow-lg transition-all flex items-center space-x-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                Fee & Payment
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Processing fees & receipt records
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/app/admissions/status"
            className="p-5 bg-white dark:bg-card rounded-3xl border border-slate-200/80 dark:border-border hover:shadow-lg transition-all flex items-center space-x-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                Admission Status
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Track decision & offer letter
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/app/admissions/wizard"
            className="p-5 bg-indigo-50 dark:bg-indigo-950/30 rounded-3xl border border-indigo-100 dark:border-indigo-800 hover:shadow-lg transition-all flex items-center space-x-4 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-extrabold text-indigo-950 dark:text-indigo-200 group-hover:text-indigo-600 transition-colors">
                Apply for Another Child
              </h4>
              <p className="text-xs text-indigo-700/70 dark:text-indigo-300/70 truncate mt-0.5">
                Start new enrollment wizard
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboardPage;
