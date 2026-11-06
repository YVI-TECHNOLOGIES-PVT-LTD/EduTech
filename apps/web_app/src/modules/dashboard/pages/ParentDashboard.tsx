import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getCurrentSessionGeneration } from '../../../lib/auth/sessionReset';
import { Link } from 'react-router-dom';
import {
  FileText,
  Bell,
  Clock,
  CheckCircle2,
  Circle,
  ArrowRight,
  CreditCard,
  Calendar,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Sparkles,
  Users,
  Activity,
  Award,
  TrendingUp,
  HelpCircle,
  ChevronRight,
  ClipboardList,
  DollarSign,
  AlertTriangle,
  FolderCheck,
} from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '../../../components/layout/PageWrapper';

type FeeTrackerState = 'DUE' | 'VERIFYING' | 'VERIFIED' | 'HIDDEN';

// ─── Sparkline Graph Component ──────────────────────────────────────────────────
const Sparkline = ({ points, color = 'text-primary' }: { points: number[]; color?: string }) => {
  const width = 100;
  const height = 30;
  const maxVal = Math.max(...points);
  const minVal = Math.min(...points);
  const range = maxVal - minVal || 1;

  const coordinates = points
    .map((p, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((p - minVal) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className={`w-14 h-5 ${color}`} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coordinates}
      />
    </svg>
  );
};

import { CountUp } from '../../../components/react-bits/CountUp';
import { SpotlightCard } from '../../../components/react-bits/SpotlightCard';

import { DashboardProvider } from '../core/DashboardProvider';
import { useDashboard } from '../hooks/useDashboard';

import { ParentDashboardService } from '../services/ParentDashboardService';
import { DashboardMapper } from '../utils/dashboard.mapper';

export const ParentDashboard = () => {
  return (
    <DashboardProvider>
      <ParentDashboardInner />
    </DashboardProvider>
  );
};

const ParentDashboardInner = () => {
  const { user, isAuthenticated } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [feeData, setFeeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setChildren([]);
      setAdmissions([]);
      setFeeData([]);
      setLoading(false);
      return;
    }

    const requestGen = getCurrentSessionGeneration();
    setLoading(true);

    const load = async () => {
      try {
        const [childData, feeDataRes] = await Promise.all([
          ParentDashboardService.getOverview(),
          ParentDashboardService.getMyFees(),
        ]);

        if (requestGen !== getCurrentSessionGeneration()) return;

        setChildren(childData.children || []);
        setAdmissions(childData.admissions || []);
        const feeList = Array.isArray(feeDataRes)
          ? feeDataRes
          : feeDataRes?.children || feeDataRes?.data || [];
        setFeeData(feeList);
      } catch (err) {
        if (requestGen === getCurrentSessionGeneration()) {
          console.error(err);
        }
      } finally {
        if (requestGen === getCurrentSessionGeneration()) {
          setLoading(false);
        }
      }
    };
    load();
  }, [user?.id, user?.school_id, isAuthenticated]);

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Application draft is initiated and in progress.';
      case 'submitted':
        return 'Your application has been received and is waiting for initial review.';
      case 'under_review':
        return 'An Admission Officer is currently reviewing your documents.';
      case 'docs_verified':
        return 'Documents verified! The school will soon enable the fee payment option for you.';
      case 'payment_pending':
        return 'ACTION REQUIRED: Please submit your admission fee to proceed.';
      case 'payment_submitted':
        return 'Payment details received. Our finance team is verifying your transaction.';
      case 'payment_verified':
        return 'Payment verified! Your application is now moving for final school approval.';
      case 'recommended':
        return 'Recommended for admission! Waiting for final approval from the Head of Institution.';
      case 'approved':
        return 'CONGRATULATIONS! Your admission is approved. You will be enrolled soon.';
      case 'enrolled':
        return 'Enrolled successfully. Welcome to the student master registry!';
      default:
        return 'Monitoring your application progress...';
    }
  };

  const getFeeBalance = (studentId: string) => {
    const list = Array.isArray(feeData) ? feeData : (feeData as any)?.children || [];
    const record = list.find((f: any) => f.student?.id === studentId || f.student_id === studentId);
    return record?.summary?.outstanding_balance ?? record?.summary?.balance ?? 0;
  };

  // Tracker State Derivation
  const getTrackerState = (app: any): FeeTrackerState => {
    if (!app?.payment_enabled) return 'HIDDEN';
    if (
      app.payment_reference &&
      app.status !== 'payment_verified' &&
      !['recommended', 'approved', 'enrolled'].includes(app.status)
    ) {
      return 'VERIFYING';
    }
    if (['payment_verified', 'recommended', 'approved', 'enrolled'].includes(app.status)) {
      return 'VERIFIED';
    }
    return 'DUE';
  };

  const { kpis: engineKPIs } = useDashboard();

  const getKPIValue = (id: string, fallback: number) => {
    const item = engineKPIs.find((k: any) => k.id === id);
    return item ? DashboardMapper.safeNumber(item.value) : fallback;
  };

  const trackerContext = useMemo(() => {
    const activeApps = (admissions || []).filter((a) => getTrackerState(a) !== 'HIDDEN');
    const hasDue = activeApps.some((a) => getTrackerState(a) === 'DUE');
    const isVerifying = activeApps.some((a) => getTrackerState(a) === 'VERIFYING');
    const totalAmount = activeApps.reduce((sum, a) => sum + Number(a.payment_amount), 0);
    const stateKey = activeApps.map((a) => getTrackerState(a)).join('-');

    return { activeApps, hasDue, isVerifying, totalAmount, stateKey };
  }, [admissions]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
          Loading Parent Portal...
        </p>
      </div>
    );

  const totalStudents = children.length;
  // Dynamic admission fee due calculation based on whether fee payment is active
  const totalAdmissionFeesPending = admissions
    .filter((a) => a.payment_enabled && a.status === 'payment_pending')
    .reduce((sum, a) => sum + Number(a.payment_amount || 0), 0);
  const calculatedDue =
    feeData.reduce((sum, f) => sum + (f.summary?.balance || 0), 0) + totalAdmissionFeesPending;
  const totalDue = getKPIValue('student.kpi.fees_due', calculatedDue);

  // Dynamically calculate the active admissions status tag
  const activeAdmissionsCount = admissions.filter(
    (a) => a.status !== 'enrolled' && a.status !== 'rejected',
  ).length;
  const admissionSubLabel =
    activeAdmissionsCount > 0 ? `${activeAdmissionsCount} In Progress` : 'All Clear';

  // Overall attendance rate calculation across registered children
  const avgAttendance =
    children.length > 0
      ? Math.round(
          children.reduce((acc, c) => {
            const s = c.student || c;
            const rate = s.attendance?.[0]?.attendance_percentage ?? 95;
            return acc + rate;
          }, 0) / children.length,
        )
      : 95;

  // Pending action banners check
  const pendingDocsCount = children.reduce((sum, c) => sum + (c.document_stats?.pending || 0), 0);

  const actionAlerts: { label: string; actionText: string; url: string }[] = [];
  if (totalDue > 0) {
    actionAlerts.push({
      label: `You have outstanding fee obligations of ₹${totalDue.toLocaleString()}.`,
      actionText: 'Pay Fees',
      url: '/app/fees/my',
    });
  }
  if (pendingDocsCount > 0) {
    actionAlerts.push({
      label: `${pendingDocsCount} required student document(s) pending verification or upload.`,
      actionText: 'Document Center',
      url: '/app/parent/documents',
    });
  }
  if (totalAdmissionFeesPending > 0) {
    actionAlerts.push({
      label: `Admission fee payment of ₹${totalAdmissionFeesPending.toLocaleString()} is ready for processing.`,
      actionText: 'Complete Payment',
      url: '/app/parent/payments',
    });
  }

  const kpis = [
    {
      label: 'My Children',
      value: totalStudents,
      icon: GraduationCap,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      sub: 'Active profiles',
      points: [0, 1, totalStudents],
    },
    {
      label: 'Avg Attendance',
      value: avgAttendance,
      icon: Activity,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      suffix: '%',
      sub: avgAttendance >= 85 ? 'On Track' : 'Needs Attention',
      points: [80, 90, avgAttendance],
    },
    {
      label: 'Admissions Progress',
      value: activeAdmissionsCount,
      icon: ClipboardList,
      color:
        activeAdmissionsCount > 0
          ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
          : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      sub: admissionSubLabel,
      points: [0, activeAdmissionsCount],
    },
    {
      label: 'Fees Pending',
      value: totalDue,
      icon: DollarSign,
      color:
        totalDue > 0
          ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
          : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      format: '₹',
      sub: totalDue > 0 ? 'Payment Required' : 'All Clear',
      points: [0, totalDue],
    },
  ];

  const kpiElements = kpis.map((c, i) => (
    <SpotlightCard
      key={i}
      spotlightColor="rgba(6, 63, 64, 0.08)"
      className="group relative bg-white dark:bg-card p-6 border-border/50 shadow-premium-sm hover:shadow-premium-md transition-all duration-300 card-hover-lift flex flex-col justify-between"
    >
      <div className="flex items-start justify-between">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${c.color}`}
        >
          <c.icon className="w-6 h-6" />
        </div>
        <Sparkline points={c.points} color={c.color.split(' ')[0]} />
      </div>

      <div className="mt-5 space-y-1">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
          {c.label}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-navy dark:text-white tracking-tight">
            {c.format}
            <CountUp to={c.value} />
            {c.suffix}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground ml-1">{c.sub}</span>
        </div>
      </div>
    </SpotlightCard>
  ));

  return (
    <PageWrapper
      title="Parent Dashboard"
      description="Track your child's academic cycles, grade logs, and fee ledger obligations."
      icon={Sparkles}
      kpis={<>{kpiElements}</>}
      timeline={
        <div className="space-y-6 lg:space-y-8">
          {/* Quick actions links */}
          <div className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm">
            <h3 className="text-xs font-black text-navy dark:text-white mb-6 uppercase tracking-wider pb-4 border-b border-border/45 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Shortcut Actions
            </h3>
            <div className="space-y-2 font-bold">
              <Link
                to="/app/parent/my-child"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/50 group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">
                    My Children Hub
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/app/fees/my"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/50 group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">
                    Pay Fees Portal
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/app/parent/documents"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/50 group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <FolderCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">
                    Documents Centre
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/app/communication/feeds"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/50 group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    <Bell className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">
                    School Feeds & Announcements
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/app/communication/helpdesk"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/50 group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">
                    Parent Support & Helpdesk
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-navy via-blue-900 to-indigo-950 p-6 rounded-3xl text-white shadow-premium-lg relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            <h3 className="font-black text-sm mb-1 text-gold">Portal Assistance</h3>
            <p className="text-white/80 text-xs mb-4">
              Need help regarding admissions, document processing, or fees? Contact school desk.
            </p>
            <Link
              to="/app/communication/helpdesk"
              className="inline-block bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-sm transition-all"
            >
              Submit Inquiry
            </Link>
          </div>
        </div>
      }
    >
      <div className="space-y-6 lg:space-y-8">
        {/* Visual Cover Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-navy via-blue-900 to-indigo-950 p-8 rounded-3xl text-white shadow-xl border border-white/10">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <span className="bg-gold text-navy text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Parent Dashboard
          </span>
          <h1 className="text-3xl font-black mt-2 tracking-tight">Welcome Back</h1>
          <p className="text-white/70 text-xs mt-1 max-w-md leading-relaxed">
            Quickly monitor your family's academic standing, notice bulletins, and pending
            administrative balances.
          </p>
        </div>

        {/* Pending Actions Alert Banner */}
        {actionAlerts.length > 0 && (
          <div className="space-y-3">
            {actionAlerts.map((alert, idx) => (
              <div
                key={idx}
                className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                      Pending Action
                    </span>
                    <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">
                      {alert.label}
                    </p>
                  </div>
                </div>
                <Link
                  to={alert.url}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all shrink-0"
                >
                  {alert.actionText}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Active Fee Obligations Tracker Roadmap */}
        <AnimatePresence mode="wait">
          {trackerContext.activeApps.length > 0 && (
            <motion.div
              key={trackerContext.stateKey}
              className="bg-white dark:bg-card p-6 rounded-3xl border border-border/40 shadow-premium-sm relative overflow-hidden"
            >
              <h3 className="text-xs font-black text-navy dark:text-white uppercase tracking-wider mb-6 pb-4 border-b border-border/45">
                Financial Roadmap Tracker
              </h3>

              <div className="space-y-4">
                {trackerContext.activeApps.map((a) => {
                  const state = getTrackerState(a);
                  const isDue = state === 'DUE';
                  const isVerifying = state === 'VERIFYING';

                  return (
                    <div
                      key={a.id}
                      className="p-5 rounded-2xl border border-border/40 bg-gray-50/20 dark:bg-muted/5 flex flex-col md:flex-row md:items-center justify-between gap-6"
                    >
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                          {a.student_name}
                        </span>
                        <div className="text-2xl font-black text-navy dark:text-white">
                          ₹{Number(a.payment_amount).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex gap-4 items-center">
                        <div
                          className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border ${
                            isDue
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              : isVerifying
                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          }`}
                        >
                          {isDue ? 'Due' : isVerifying ? 'Verifying' : 'Complete'}
                        </div>
                        <Link
                          to={`/app/admissions/${a.id}`}
                          className="text-[10px] font-black text-indigo-500 uppercase hover:underline"
                        >
                          Manage →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Admission Applications Timelines */}
        {admissions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-black text-navy dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Admission Status Timeline
            </h2>
            {admissions.map((app) => {
              const steps = [
                { key: 'draft', label: 'Draft Started' },
                { key: 'submitted', label: 'Submitted' },
                { key: 'under_review', label: 'Under Review' },
                { key: 'docs_verified', label: 'Docs Verified' },
                { key: 'payment_pending', label: 'Payment Pending' },
                { key: 'payment_submitted', label: 'Payment Submitted' },
                { key: 'payment_verified', label: 'Payment Verified' },
                { key: 'recommended', label: 'Recommended' },
                { key: 'approved', label: 'Approved' },
                { key: 'enrolled', label: 'Enrolled' },
              ];
              const currentIdx = steps.findIndex((s) => s.key === app.status);
              return (
                <div
                  key={app.id}
                  className="bg-white dark:bg-card border border-border/40 rounded-3xl p-6 shadow-premium-sm space-y-4"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-border/45">
                    <div>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                        Applicant: {app.student_name}
                      </span>
                      <h3 className="font-black text-sm text-navy dark:text-white mt-0.5">
                        Grade Applied: {app.grade_applied_for}
                      </h3>
                      <p className="text-[10px] text-gray-500 font-medium mt-1">
                        {getStatusMessage(app.status)}
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-gold/15 text-gold-dark border border-gold/30">
                      Stage {currentIdx + 1}: {app.status?.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Stepper block wrapper */}
                  <div className="relative flex justify-between items-center gap-2 pt-2 overflow-x-auto pb-4 scrollbar-hide">
                    {steps.map((step, idx) => {
                      const isCompleted = idx < currentIdx;
                      const isActive = idx === currentIdx;
                      return (
                        <div
                          key={idx}
                          className="flex flex-col items-center text-center flex-1 min-w-[70px] relative z-10"
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] transition-all ${
                              isCompleted
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : isActive
                                  ? 'bg-primary text-white ring-4 ring-primary/20 animate-pulse'
                                  : 'bg-gray-200 text-gray-400 dark:bg-muted/20'
                            }`}
                          >
                            {isCompleted ? '✓' : idx + 1}
                          </div>
                          <p
                            className={`text-[8px] font-black mt-2 leading-tight ${isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
                          >
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Streamlined Registered Children Quick-Access Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black text-navy dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Registered Children
            </h2>
            <Link
              to="/app/parent/my-child"
              className="text-xs font-black text-primary hover:underline flex items-center gap-1"
            >
              Open My Children Hub <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {children.length === 0 && admissions.length === 0 ? (
            <div className="bg-white dark:bg-card p-12 rounded-3xl border border-dashed border-border/60 text-center">
              <GraduationCap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3 animate-bounce" />
              <h3 className="text-sm font-black text-gray-900 dark:text-white">
                No active profiles mapped
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5">
                Contact school administrators to link student registries.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Enrolled Student Quick-Access Cards */}
              {children.map((child) => {
                const s = child.student || child;
                const attendancePercent = s.attendance?.[0]?.attendance_percentage ?? 95;
                const fullName =
                  s.full_name ||
                  child.full_name ||
                  `${s.first_name || child.first_name || ''} ${s.last_name || child.last_name || ''}`.trim() ||
                  'Student';
                const admissionNo =
                  s.admission_no || s.student_code || child.admission_no || 'Pending';
                const academicYear = s.academic_year_name || child.academic_year_name || null;
                const gradeName = s.grade_name || child.grade_name || null;
                const sectionName = s.section_name || child.section_name || null;
                const rollNumber = s.roll_number || child.roll_number || null;
                const balance = getFeeBalance(child.student_id);

                return (
                  <div
                    key={child.student_id}
                    className="bg-white dark:bg-card border border-border/50 rounded-3xl p-6 shadow-premium-sm hover:shadow-premium-md transition-all duration-300 flex flex-col justify-between gap-5"
                  >
                    <div>
                      {/* Top identity bar */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-navy to-blue-900 text-white flex items-center justify-center text-base font-black shadow-sm shrink-0">
                            {fullName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-black text-base text-navy dark:text-white leading-tight">
                              {fullName}
                            </h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                              ID: {admissionNo}
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                          {s.status || 'Enrolled'}
                        </span>
                      </div>

                      {/* Academic Placement Tags */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-muted/30 text-navy dark:text-white border border-border/40">
                          <GraduationCap className="w-3 h-3 text-indigo-500" />
                          {gradeName || 'Grade Pending'}
                        </span>
                        {sectionName && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-muted/30 text-navy dark:text-white border border-border/40">
                            <Users className="w-3 h-3 text-teal-600" />
                            Sec {sectionName}
                          </span>
                        )}
                        {rollNumber && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-muted/30 text-navy dark:text-white border border-border/40">
                            <ClipboardList className="w-3 h-3 text-purple-500" />
                            Roll #{rollNumber}
                          </span>
                        )}
                        {academicYear && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-muted/30 text-muted-foreground border border-border/40">
                            <Calendar className="w-3 h-3 text-primary" />
                            {academicYear}
                          </span>
                        )}
                      </div>

                      {/* Snapshot Metrics */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="p-3 bg-gray-50/70 dark:bg-muted/10 rounded-2xl border border-border/30">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            Attendance
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Activity className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-sm font-black text-navy dark:text-white">
                              {attendancePercent}%
                            </span>
                          </div>
                        </div>

                        <div className="p-3 bg-gray-50/70 dark:bg-muted/10 rounded-2xl border border-border/30">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            Fee Balance
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <CreditCard className="w-3.5 h-3.5 text-primary" />
                            <span className="text-sm font-black text-navy dark:text-white">
                              {balance > 0 ? `₹${balance.toLocaleString()}` : 'Cleared'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation CTA: Deep link to My Children */}
                    <div className="pt-2 border-t border-border/30 flex items-center justify-between gap-3">
                      <Link
                        to={`/app/parent/documents`}
                        className="text-[10px] font-black text-muted-foreground hover:text-navy dark:hover:text-white transition-colors"
                      >
                        Documents
                      </Link>
                      <Link
                        to={`/app/fees/my`}
                        className="text-[10px] font-black text-muted-foreground hover:text-navy dark:hover:text-white transition-colors"
                      >
                        Invoices
                      </Link>
                      <Link
                        to={`/app/parent/my-child?childId=${child.student_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-navy hover:bg-navy/90 text-white shadow-xs transition-all ml-auto"
                      >
                        View Profile & Records
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}

              {/* Render Admission Applicant Cards */}
              {admissions.map((app) => (
                <div
                  key={app.id}
                  className="bg-white dark:bg-card border border-border/50 rounded-3xl p-6 shadow-premium-sm hover:shadow-premium-md transition-all duration-300 flex flex-col justify-between gap-5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center text-base font-black shadow-sm shrink-0">
                          {app.student_name?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-black text-base text-navy dark:text-white leading-tight">
                            {app.student_name}
                          </h3>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            Applied Grade: {app.grade_applied_for}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 border border-amber-500/30 shrink-0">
                        {app.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="p-3 bg-gray-50/70 dark:bg-muted/10 rounded-2xl border border-border/30">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                          Stage
                        </p>
                        <p className="text-xs font-bold text-navy dark:text-white capitalize mt-1">
                          {app.status?.replace('_', ' ')}
                        </p>
                      </div>

                      <div className="p-3 bg-gray-50/70 dark:bg-muted/10 rounded-2xl border border-border/30">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                          Admission Fee
                        </p>
                        <p className="text-xs font-bold text-navy dark:text-white mt-1">
                          ₹{Number(app.payment_amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/30 flex justify-end">
                    <Link
                      to={`/app/admissions/${app.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all"
                    >
                      View Application Timeline
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};
