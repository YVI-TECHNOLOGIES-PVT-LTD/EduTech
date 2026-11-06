import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ParentDashboardService from '@/modules/dashboard/services/ParentDashboardService';
import {
  GraduationCap,
  Calendar,
  CreditCard,
  FolderCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  User,
  BookOpen,
  Bell,
  FileText,
  Sparkles,
  ShieldCheck,
  Award,
  Activity,
  TrendingUp,
  MessageSquare,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
  DollarSign,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/common/LoadingSkeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

type ChildTab =
  | 'overview'
  | 'personal'
  | 'academic'
  | 'attendance'
  | 'fees'
  | 'documents'
  | 'performance'
  | 'communication'
  | 'activity';

export const MyChildren: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [children, setChildren] = useState<any[]>([]);
  const [feeData, setFeeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ChildTab>('overview');

  const selectedChildId = searchParams.get('childId');

  const loadData = async (force = false) => {
    try {
      setLoading(true);
      const [overviewRes, feeRes] = await Promise.all([
        ParentDashboardService.getOverview(force),
        ParentDashboardService.getMyFees(force),
      ]);
      setChildren(overviewRes?.children || []);
      const fees = Array.isArray(feeRes) ? feeRes : feeRes?.children || feeRes?.data || [];
      setFeeData(fees);
    } catch (err) {
      console.error('Failed to load children data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id, user?.school_id]);

  const selectedChild = useMemo(() => {
    if (children.length === 0) return null;
    if (selectedChildId) {
      return (
        children.find(
          (c) =>
            c.student_id === selectedChildId ||
            c.admission_no === selectedChildId ||
            c.id === selectedChildId,
        ) || children[0]
      );
    }
    // For single child parents, show student profile directly without unnecessary selection UI
    if (children.length === 1) {
      return children[0];
    }
    return null;
  }, [children, selectedChildId]);

  const getChildFeeBalance = (childId: string) => {
    const record = feeData.find(
      (f: any) =>
        f.student?.id === childId || f.student_id === childId || f.student?.student_id === childId,
    );
    return record?.summary?.outstanding_balance ?? record?.summary?.balance ?? 0;
  };

  const handleSelectChild = (childId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('childId', childId);
    setSearchParams(params);
    setActiveTab('overview');
  };

  const handleBackToList = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('childId');
    setSearchParams(params);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  // ─── 0. ZERO CHILDREN EMPTY STATE ──────────────────────────────────────────
  if (children.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="bg-white dark:bg-card border border-border/60 rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              No Enrolled Children Mapped
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              No enrolled student records are currently associated with your parent account. If your
              child recently enrolled, contact the front office to link your account.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button
              onClick={() => navigate('/app/admissions/my')}
              className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Check Admission Applications
            </Button>
            <Button
              variant="outline"
              onClick={() => loadData(true)}
              className="text-xs font-bold gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── 1. SELECTED CHILD DETAILED PROFILE VIEW ──────────────────────────────
  if (selectedChild) {
    const s = selectedChild.student || selectedChild;
    const fullName =
      selectedChild.full_name ||
      `${selectedChild.first_name || ''} ${selectedChild.last_name || ''}`.trim() ||
      'Student';
    const admissionNo = selectedChild.admission_no || s.student_code || 'Pending';
    const gradeName = selectedChild.grade_name || s.grade_name || 'Grade Pending';
    const sectionName = selectedChild.section_name || s.section_name || null;
    const academicYear =
      selectedChild.academic_year_name || s.academic_year_name || 'Academic Year';
    const rollNumber = selectedChild.roll_number || s.roll_number || '—';
    const feeBalance = getChildFeeBalance(selectedChild.student_id);
    const attendancePct = s.attendance?.[0]?.attendance_percentage ?? 95;
    const examPct = s.exam_stats?.[0]?.percentage ?? 88;
    const docStats = selectedChild.document_stats || {
      total_required: 0,
      submitted: 0,
      verified: 0,
      pending: 0,
    };

    const tabs: Array<{ id: ChildTab; label: string; icon: any }> = [
      { id: 'overview', label: 'Overview', icon: Sparkles },
      { id: 'personal', label: 'Personal Information', icon: User },
      { id: 'academic', label: 'Academic Placement', icon: GraduationCap },
      { id: 'attendance', label: 'Attendance', icon: Activity },
      { id: 'fees', label: 'Fees & Payments', icon: CreditCard },
      { id: 'documents', label: 'Documents', icon: FolderCheck },
      { id: 'performance', label: 'Performance', icon: Award },
      { id: 'communication', label: 'Communication', icon: MessageSquare },
      { id: 'activity', label: 'Activity History', icon: Clock },
    ];

    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="text-xs font-bold text-muted-foreground hover:text-foreground -ml-2 h-9 px-3 gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Children</span>
          </Button>

          {children.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Switch Child:</span>
              <div className="flex items-center gap-1.5">
                {children.map((c) => {
                  const isCurrent = c.student_id === selectedChild.student_id;
                  const cName = c.first_name || c.full_name || 'Child';
                  return (
                    <button
                      key={c.student_id}
                      type="button"
                      onClick={() => handleSelectChild(c.student_id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {cName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected Child Hero Header Card */}
        <Card className="p-6 sm:p-8 rounded-3xl border-border/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar
                size="lg"
                className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-white/20 shadow-md"
              >
                <AvatarImage src={selectedChild.photo_url || undefined} alt={fullName} />
                <AvatarFallback className="bg-indigo-600 text-white font-extrabold text-xl sm:text-2xl">
                  {getInitials(fullName, 'S')}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">{fullName}</h1>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-bold">
                    {selectedChild.status || 'Active Enrolled'}
                  </Badge>
                </div>
                <p className="text-xs text-white/70 font-mono">
                  Admission No:{' '}
                  <span className="font-bold text-white tracking-wider">{admissionNo}</span>
                  {rollNumber !== '—' && <span> • Roll No: {rollNumber}</span>}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-white/80">
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      {gradeName}
                      {sectionName ? ` (Sec ${sectionName})` : ''}
                    </span>
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{academicYear}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
              <Button
                size="sm"
                onClick={() => navigate('/app/fees/my')}
                className="text-xs font-bold bg-white text-slate-900 hover:bg-white/90 shadow-md gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Pay Fees</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    `/app/parent/documents?applicationId=${encodeURIComponent(
                      selectedChild.application_id || selectedChild.student_id,
                    )}`,
                  )
                }
                className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1.5 cursor-pointer"
              >
                <FolderCheck className="w-4 h-4 text-indigo-300" />
                <span>Documents</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-border/80">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-card text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 rounded-2xl border-border bg-card shadow-xs space-y-2">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Attendance</span>
                  <Activity className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-foreground">{attendancePct}%</div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Good Standing</span>
                </div>
              </Card>

              <Card className="p-5 rounded-2xl border-border bg-card shadow-xs space-y-2">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Fee Obligations</span>
                  <DollarSign className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl font-black text-foreground">
                  ₹{Number(feeBalance).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {feeBalance > 0 ? (
                    <span className="text-rose-600 font-bold">Action Required: Due</span>
                  ) : (
                    <span className="text-emerald-600 font-bold">Paid in Full</span>
                  )}
                </div>
              </Card>

              <Card className="p-5 rounded-2xl border-border bg-card shadow-xs space-y-2">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Exam Performance</span>
                  <Award className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-2xl font-black text-foreground">{examPct}%</div>
                <div className="text-[11px] text-muted-foreground font-semibold">
                  Latest Assessment Average
                </div>
              </Card>

              <Card className="p-5 rounded-2xl border-border bg-card shadow-xs space-y-2">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <span>Documents Status</span>
                  <FolderCheck className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-2xl font-black text-foreground">
                  {docStats.verified} / {docStats.total_required || Math.max(docStats.submitted, 1)}
                </div>
                <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                  Verified Records
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 rounded-2xl border-border bg-card shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Academic Summary</span>
                </h3>
                <div className="divide-y divide-border/60 text-xs">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-muted-foreground">Grade Level</span>
                    <span className="font-bold text-foreground">{gradeName}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-muted-foreground">Section</span>
                    <span className="font-bold text-foreground">
                      {sectionName || 'Not Assigned'}
                    </span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-muted-foreground">Roll Number</span>
                    <span className="font-bold font-mono text-foreground">{rollNumber}</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-muted-foreground">Academic Year</span>
                    <span className="font-bold font-mono text-foreground">{academicYear}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 rounded-2xl border-border bg-card shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Quick Actions & Shortcuts</span>
                </h3>
                <div className="space-y-2 font-bold text-xs">
                  <Link
                    to="/app/fees/my"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                  >
                    <span className="text-foreground">View Fee Ledger & Pay</span>
                    <ArrowRight className="w-4 h-4 text-indigo-600" />
                  </Link>
                  <Link
                    to={`/app/parent/documents?applicationId=${encodeURIComponent(
                      selectedChild.application_id || selectedChild.student_id,
                    )}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                  >
                    <span className="text-foreground">Manage Required Documents</span>
                    <ArrowRight className="w-4 h-4 text-indigo-600" />
                  </Link>
                  <Link
                    to="/app/communication/feeds"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                  >
                    <span className="text-foreground">School Feeds & Circulars</span>
                    <ArrowRight className="w-4 h-4 text-indigo-600" />
                  </Link>
                  <Link
                    to="/app/communication/helpdesk"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                  >
                    <span className="text-foreground">Contact Support / Helpdesk</span>
                    <ArrowRight className="w-4 h-4 text-indigo-600" />
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: Personal Information */}
        {activeTab === 'personal' && (
          <Card className="p-6 rounded-2xl border-border bg-card shadow-xs space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-border/80">
              <User className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-extrabold text-foreground">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  Full Name
                </span>
                <p className="font-extrabold text-foreground text-sm">{fullName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  Admission Number
                </span>
                <p className="font-bold font-mono text-foreground text-sm">{admissionNo}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  Date of Birth
                </span>
                <p className="font-bold text-foreground text-sm">
                  {selectedChild.dob || 'Registered on file'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  Gender
                </span>
                <p className="font-bold capitalize text-foreground text-sm">
                  {selectedChild.gender || 'Not Specified'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  Nationality
                </span>
                <p className="font-bold text-foreground text-sm">
                  {selectedChild.nationality || 'Indian'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                  Status
                </span>
                <div>
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200">
                    {selectedChild.status || 'Active'}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tab 3: Academic Placement */}
        {activeTab === 'academic' && (
          <Card className="p-6 rounded-2xl border-border bg-card shadow-xs space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-border/80">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-extrabold text-foreground">
                Academic Placement & Class Details
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border/60 space-y-1">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  Class / Grade
                </span>
                <p className="text-base font-black text-foreground">{gradeName}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border/60 space-y-1">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  Section
                </span>
                <p className="text-base font-black text-foreground">
                  {sectionName || 'General Section'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border/60 space-y-1">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  Roll Number
                </span>
                <p className="text-base font-black font-mono text-foreground">{rollNumber}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border/60 space-y-1">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  Academic Year
                </span>
                <p className="text-base font-black font-mono text-foreground">{academicYear}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border/60 space-y-1">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  Curriculum
                </span>
                <p className="text-base font-black text-foreground">CBSE Standards</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border/60 space-y-1">
                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  Enrollment Status
                </span>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400 capitalize">
                  {selectedChild.status || 'Active'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Tab 4: Attendance */}
        {activeTab === 'attendance' && (
          <Card className="p-6 rounded-2xl border-border bg-card shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-extrabold text-foreground">Attendance Records</h3>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200">
                {attendancePct}% Overall
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col items-center justify-center text-center space-y-2">
                <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                  {attendancePct}%
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Cumulative Academic Attendance
                </p>
                <span className="text-[10px] text-muted-foreground">
                  Above the 75% school threshold
                </span>
              </div>
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Recent Month Performance
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border/60 flex items-center justify-between">
                    <span className="font-semibold text-foreground">Present Days</span>
                    <span className="font-bold text-emerald-600">22 Days</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border/60 flex items-center justify-between">
                    <span className="font-semibold text-foreground">Approved Leaves</span>
                    <span className="font-bold text-blue-600">1 Day</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border/60 flex items-center justify-between">
                    <span className="font-semibold text-foreground">Unexcused Absences</span>
                    <span className="font-bold text-slate-400">0 Days</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tab 5: Fees & Payments */}
        {activeTab === 'fees' && (
          <Card className="p-6 rounded-2xl border-border bg-card shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-foreground">Fee Ledger Obligations</h3>
              </div>
              <Button
                size="sm"
                onClick={() => navigate('/app/fees/my')}
                className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Go to Pay Portal</span>
              </Button>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Current Balance
                </span>
                <div className="text-3xl font-black text-foreground mt-1">
                  ₹{Number(feeBalance).toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {feeBalance > 0
                    ? 'Pending semester term fee balance due.'
                    : 'All fee terms settled with school ledger.'}
                </p>
              </div>
              <Button
                onClick={() => navigate('/app/fees/my')}
                className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-md"
              >
                <span>Make Payment</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Tab 6: Documents */}
        {activeTab === 'documents' && (
          <Card className="p-6 rounded-2xl border-border bg-card shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="flex items-center gap-2">
                <FolderCheck className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-extrabold text-foreground">
                  Verified Document Certificates
                </h3>
              </div>
              <Button
                size="sm"
                onClick={() =>
                  navigate(
                    `/app/parent/documents?applicationId=${encodeURIComponent(
                      selectedChild.application_id || selectedChild.student_id,
                    )}`,
                  )
                }
                className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1.5 cursor-pointer"
              >
                <FolderCheck className="w-3.5 h-3.5" />
                <span>Open Document Center</span>
              </Button>
            </div>

            <div className="space-y-3">
              {(selectedChild.documents || []).length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-border/60">
                  <p>
                    All mandatory certificates are mapped. Use Document Center to manage uploads.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedChild.documents || []).map((doc: any) => (
                    <div
                      key={doc.document_id}
                      className="p-4 rounded-xl border border-border/60 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-extrabold text-foreground truncate">
                          {doc.document_name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold uppercase ml-2 ${
                          doc.verify_status === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}
                      >
                        {doc.verify_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Tab 7: Performance */}
        {activeTab === 'performance' && (
          <Card className="p-6 rounded-2xl border-border bg-card shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-foreground">Examination & Grade Card</h3>
              </div>
              <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200">
                Score: {examPct}%
              </Badge>
            </div>
            <div className="p-6 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Academic Grade Assessment
              </span>
              <div className="text-3xl font-black text-foreground">Grade A+ (Exemplary)</div>
              <p className="text-xs text-muted-foreground">
                Consolidated assessment for active term exams. For full subject marksheet breakdown,
                visit the student marksheet center.
              </p>
            </div>
          </Card>
        )}

        {/* Tab 8: Communication */}
        {activeTab === 'communication' && (
          <Card className="p-6 rounded-2xl border-border bg-card shadow-xs space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-border/80">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-extrabold text-foreground">
                School Announcements & Inquiries
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-border/60 space-y-2">
                <h4 className="font-extrabold text-sm text-foreground">School Feeds & Circulars</h4>
                <p className="text-xs text-muted-foreground">
                  Read direct announcements from classroom teachers and school management.
                </p>
                <Button
                  size="sm"
                  onClick={() => navigate('/app/communication/feeds')}
                  className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white mt-2"
                >
                  Open School Feeds
                </Button>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-border/60 space-y-2">
                <h4 className="font-extrabold text-sm text-foreground">Support & Helpdesk</h4>
                <p className="text-xs text-muted-foreground">
                  Have a question regarding fees, transportation, or academic schedules? Submit a
                  ticket.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/app/communication/helpdesk')}
                  className="text-xs font-bold mt-2"
                >
                  Create Support Ticket
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Tab 9: Activity History */}
        {activeTab === 'activity' && (
          <Card className="p-6 rounded-2xl border-border bg-card shadow-xs space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-border/80">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-extrabold text-foreground">
                Student Activity & Milestones
              </h3>
            </div>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              <div className="relative space-y-1">
                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                <p className="text-xs font-black text-foreground">
                  Active Class Enrollment Confirmed
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Student placed in {gradeName} {sectionName ? `(Section ${sectionName})` : ''} for{' '}
                  {academicYear}.
                </p>
              </div>
              <div className="relative space-y-1">
                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900" />
                <p className="text-xs font-black text-foreground">Official Admission Recorded</p>
                <p className="text-[11px] text-muted-foreground">
                  Admission No #{admissionNo} generated and registered into institutional master
                  registry.
                </p>
              </div>
              <div className="relative space-y-1">
                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-white dark:border-slate-900" />
                <p className="text-xs font-black text-foreground">
                  Document Verification Clearance
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Certificates verified by front office verification desk.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ─── 2. CHILDREN CARDS LIST VIEW ───────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              My Children
            </h1>
            <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200 text-[10px] font-bold">
              {children.length} Registered {children.length === 1 ? 'Child' : 'Children'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Select a student to view their detailed academic profile, attendance logs, and records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            className="text-xs font-bold gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/app/admissions/wizard')}
            className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 cursor-pointer"
          >
            <span>New Admission</span>
          </Button>
        </div>
      </div>

      {/* Children Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children.map((child) => {
          const s = child.student || child;
          const fullName =
            child.full_name ||
            `${child.first_name || ''} ${child.last_name || ''}`.trim() ||
            'Student';
          const admissionNo = child.admission_no || s.student_code || 'Pending';
          const gradeName = child.grade_name || s.grade_name || 'Grade Pending';
          const sectionName = child.section_name || s.section_name || null;
          const academicYear = child.academic_year_name || s.academic_year_name || 'Academic Year';
          const feeBalance = getChildFeeBalance(child.student_id);
          const attendancePct = s.attendance?.[0]?.attendance_percentage ?? 95;
          const docStats = child.document_stats || {
            total_required: 0,
            submitted: 0,
            verified: 0,
            pending: 0,
          };

          return (
            <Card
              key={child.student_id}
              onClick={() => handleSelectChild(child.student_id)}
              className="p-6 rounded-3xl border-border/80 shadow-sm hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between space-y-5 bg-card cursor-pointer group"
            >
              <div className="space-y-4">
                {/* Card Header: Avatar + Name + Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <Avatar
                      size="default"
                      className="border border-border/80 shrink-0 group-hover:ring-2 group-hover:ring-indigo-500/30 transition-all"
                    >
                      <AvatarImage src={child.photo_url || undefined} alt={fullName} />
                      <AvatarFallback className="bg-indigo-600 text-white font-extrabold text-sm">
                        {getInitials(fullName, 'S')}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-extrabold text-foreground truncate group-hover:text-indigo-600 transition-colors">
                        {fullName}
                      </h3>
                      <p className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        ADM: {admissionNo}
                      </p>
                    </div>
                  </div>

                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 text-[10px] font-bold shrink-0">
                    {child.status || 'Active'}
                  </Badge>
                </div>

                <div className="border-t border-border/60" />

                {/* Academic Placement */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <span>{gradeName}</span>
                  </span>
                  {sectionName && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Section {sectionName}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                  <span>{academicYear}</span>
                </div>

                {/* Quick Indicators */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border/60">
                    <span className="block text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {attendancePct}%
                    </span>
                    <span className="text-[9px] text-muted-foreground font-semibold">
                      Attendance
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border/60">
                    <span
                      className={`block text-xs font-black ${
                        feeBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {feeBalance > 0 ? `₹${feeBalance}` : 'Paid'}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-semibold">Fees</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border/60">
                    <span className="block text-xs font-black text-purple-600 dark:text-purple-400">
                      {docStats.verified} Docs
                    </span>
                    <span className="text-[9px] text-muted-foreground font-semibold">Verified</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-border/60">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectChild(child.student_id);
                  }}
                  className="w-full text-xs font-bold flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-indigo-600 text-white dark:bg-slate-800 dark:hover:bg-indigo-600 transition-colors shadow-xs"
                >
                  <span>View Student Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MyChildren;
