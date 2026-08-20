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

import { ApplicationStatusCard } from '../../components/ApplicationStatusCard';
import { Skeleton } from '@/components/ui/skeleton';

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
      <div className="space-y-8 max-w-7xl mx-auto">
        <Skeleton className="h-44 w-full rounded-3xl" />
        <div className="space-y-6">
          <Skeleton className="h-5 w-48 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <Card key={i} className="p-6 rounded-3xl border-slate-200/80 space-y-5">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4 rounded" />
                    <Skeleton className="h-4 w-1/2 rounded" />
                  </div>
                </div>
                <Skeleton className="h-px w-full" />
                <div className="grid grid-cols-4 gap-3">
                  <Skeleton className="h-14 rounded-2xl" />
                  <Skeleton className="h-14 rounded-2xl" />
                  <Skeleton className="h-14 rounded-2xl" />
                  <Skeleton className="h-14 rounded-2xl" />
                </div>
                <Skeleton className="h-px w-full" />
                <div className="flex justify-end gap-3">
                  <Skeleton className="h-9 w-32 rounded-xl" />
                  <Skeleton className="h-9 w-32 rounded-xl" />
                </div>
              </Card>
            ))}
          </div>
        </div>
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Welcome Header Banner */}
      <div className="bg-black text-white p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden border border-neutral-800">
        <div className="space-y-2 max-w-2xl z-10">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Parent Self-Service Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, {parentName}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal">
            Monitor your child's enrollment progress, submit required documents, and track
            evaluation milestones.
          </p>
        </div>

        <div className="z-10 shrink-0 w-full md:w-auto">
          <Button
            onClick={() => navigate('/app/admissions/wizard')}
            size="lg"
            className="w-full md:w-auto font-bold shadow-lg flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Application</span>
          </Button>
        </div>
      </div>

      {/* 2. Active Application Status Overview / Empty State */}
      {applications.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center rounded-2xl border-border/80 shadow-sm max-w-xl mx-auto space-y-5 bg-card">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-200/80 dark:border-indigo-800">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-foreground">No Admission Applications Yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Start your child's enrollment process by completing an online admission application.
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={() => navigate('/app/admissions/wizard')}
              size="lg"
              className="w-full sm:w-auto font-bold shadow-lg"
            >
              Start New Application
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Active Application Status ({applications.length})
            </h2>
            <button
              onClick={() => refetch()}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Status</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {applications.map((app: any) => (
              <ApplicationStatusCard key={app.application_id || app.id} application={app} />
            ))}
          </div>
        </div>
      )}

      {/* 3. Quick Action Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Quick Actions & Portals
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/app/admissions/my"
            className="p-5 bg-card rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all flex items-center space-x-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                My Applications
              </h4>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                View all registered applications
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/app/admissions/documents"
            className="p-5 bg-card rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all flex items-center space-x-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
              <FolderCheck className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Document Center
              </h4>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                Upload & verify birth/marksheets
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/app/admissions/fees"
            className="p-5 bg-card rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all flex items-center space-x-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Fee & Payment
              </h4>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                Processing fees & receipt records
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/app/admissions/status"
            className="p-5 bg-card rounded-2xl border border-border/80 shadow-sm hover:shadow-md transition-all flex items-center space-x-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Admission Status
              </h4>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                Track decision & offer letter
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            to="/app/admissions/wizard"
            className="p-5 bg-card rounded-2xl border border-border hover:shadow-md transition-all flex items-center space-x-4 group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                Apply for Another Child
              </h4>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                Start new enrollment wizard
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboardPage;
