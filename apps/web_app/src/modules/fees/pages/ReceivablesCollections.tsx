import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
  Coins,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Clock,
  ArrowUpRight,
  Search,
  Filter,
  Download,
  RefreshCw,
  User,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  ShieldAlert,
  Layers,
  Building2,
  CreditCard,
  FileText,
  PhoneCall,
  ListOrdered,
  PieChart,
  BarChart3,
  X,
  ExternalLink,
  ChevronDown,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';

// Liquid Glass design tokens
const GLASS_CARD =
  'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm transition-all';
const GLASS_PANEL =
  'bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-white/5 rounded-2xl';

interface ReceivablesSummary {
  totalOutstanding: number;
  totalOverdue: number;
  dueInNext7Days: number;
  dueInNext30Days: number;
  collectedThisMonth: number;
  collectionRate: number;
  studentsWithOutstanding: number;
  overdueAccountsCount: number;
  totalAssessedDues: number;
  totalAllocatedPaid: number;
  currencyCode: string;
}

interface ReceivableItem {
  student_charge_due_id: string;
  student_charge_id: string;
  student_id: string;
  admission_no: string;
  student_name: string;
  academic_year_name: string;
  academic_year_id: string;
  grade_name: string;
  grade_id: string;
  section_name: string;
  component_name: string;
  fee_component_id: string;
  term_name: string;
  installment_term_id: string | null;
  original_assessed_amount: number;
  applied_concession_pct: number;
  paid_amount: number;
  outstanding_amount: number;
  due_date: string;
  days_overdue: number;
  receivable_status: string;
  ageing_bucket: string;
  last_payment_date: string | null;
  last_follow_up_date: string | null;
}

interface AgeingBucket {
  bucketKey: string;
  bucketLabel: string;
  outstandingAmount: number;
  dueCount: number;
  studentCount: number;
  percentageOfOverdue: number;
  percentageOfTotal: number;
}

interface CollectionPerformance {
  period: string;
  startDate: string;
  endDate: string;
  grossCollectedAmount: number;
  transactionCount: number;
  onlineCollectionsAmount: number;
  offlineCollectionsAmount: number;
  paymentMethodBreakdown: Array<{ method: string; amount: number; count: number }>;
  trendByDate: Array<{ date: string; amount: number; count: number }>;
  collectionsByGrade: Array<{ gradeId: string; gradeName: string; amount: number; count: number }>;
  collectionsByComponent: Array<{ componentId: string; componentName: string; amount: number }>;
}

interface FollowUpItem {
  student_id: string;
  admission_no: string;
  student_name: string;
  academic_year_name: string;
  grade_name: string;
  section_name: string;
  total_outstanding: number;
  total_overdue: number;
  days_overdue: number;
  earliest_due_date: string;
  priority_tier: 'HIGH_RISK' | 'HIGH_VALUE' | 'STANDARD';
  status: string;
  last_follow_up: string | null;
  follow_up_supported: boolean;
}

const formatCurrency = (amount: number | null | undefined, currency = 'INR') => {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 2,
  }).format(val);
};

export const ReceivablesCollections: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'register' | 'ageing' | 'collections' | 'follow_ups'>('overview');

  // Summary State (Screen A)
  const [summary, setSummary] = useState<ReceivablesSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Register State (Screen B)
  const [registerItems, setRegisterItems] = useState<ReceivableItem[]>([]);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerPage, setRegisterPage] = useState(1);
  const [registerTotalPages, setRegisterTotalPages] = useState(1);
  const [registerTotal, setRegisterTotal] = useState(0);
  const [registerSearch, setRegisterSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBucket, setSelectedBucket] = useState('all');
  const [sortBy, setSortBy] = useState('due_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Ageing Analysis State (Screen C)
  const [ageingBuckets, setAgeingBuckets] = useState<AgeingBucket[]>([]);
  const [ageingTotalOutstanding, setAgeingTotalOutstanding] = useState(0);
  const [ageingTotalOverdue, setAgeingTotalOverdue] = useState(0);
  const [ageingLoading, setAgeingLoading] = useState(false);

  // Collection Performance State (Screen D)
  const [collectionsPeriod, setCollectionsPeriod] = useState<'today' | 'this_week' | 'this_month' | 'this_academic_year'>('this_month');
  const [performance, setPerformance] = useState<CollectionPerformance | null>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);

  // Follow-Up Queue State (Screen F)
  const [followUpItems, setFollowUpItems] = useState<FollowUpItem[]>([]);
  const [followUpGrouping, setFollowUpGrouping] = useState<'all' | 'high_outstanding' | 'long_overdue' | 'newly_overdue' | 'due_soon'>('all');
  const [followUpTierCounts, setFollowUpTierCounts] = useState<any>({ all: 0, high_outstanding: 0, long_overdue: 0, newly_overdue: 0, due_soon: 0 });
  const [followUpLoading, setFollowUpLoading] = useState(false);

  // Student Detail Modal/Drawer State (Screen E)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetail, setStudentDetail] = useState<any | null>(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);

  // Load Overview Summary
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await apiClient.get('/fees/receivables/summary');
      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load receivables summary', err);
      toast.error('Failed to load summary metrics');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Load Register
  const fetchRegister = useCallback(async () => {
    setRegisterLoading(true);
    try {
      const params: any = {
        page: registerPage,
        limit: 15,
        search: registerSearch || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        ageingBucket: selectedBucket !== 'all' ? selectedBucket : undefined,
        sortBy,
        sortOrder,
      };
      const res = await apiClient.get('/fees/receivables/register', { params });
      if (res.data?.success) {
        setRegisterItems(res.data.data.items || []);
        setRegisterTotal(res.data.data.pagination.total);
        setRegisterTotalPages(res.data.data.pagination.totalPages);
      }
    } catch (err: any) {
      console.error('Failed to load receivables register', err);
      toast.error('Failed to load receivables register');
    } finally {
      setRegisterLoading(false);
    }
  }, [registerPage, registerSearch, selectedStatus, selectedBucket, sortBy, sortOrder]);

  // Load Ageing
  const fetchAgeing = useCallback(async () => {
    setAgeingLoading(true);
    try {
      const res = await apiClient.get('/fees/receivables/ageing');
      if (res.data?.success) {
        setAgeingBuckets(res.data.data.buckets || []);
        setAgeingTotalOutstanding(res.data.data.totalOutstanding);
        setAgeingTotalOverdue(res.data.data.totalOverdue);
      }
    } catch (err: any) {
      console.error('Failed to load ageing analysis', err);
      toast.error('Failed to load ageing analysis');
    } finally {
      setAgeingLoading(false);
    }
  }, []);

  // Load Collection Performance
  const fetchPerformance = useCallback(async () => {
    setPerformanceLoading(true);
    try {
      const res = await apiClient.get('/fees/receivables/collections', {
        params: { period: collectionsPeriod },
      });
      if (res.data?.success) {
        setPerformance(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load collection performance', err);
      toast.error('Failed to load collection performance');
    } finally {
      setPerformanceLoading(false);
    }
  }, [collectionsPeriod]);

  // Load Follow-up Queue
  const fetchFollowUpQueue = useCallback(async () => {
    setFollowUpLoading(true);
    try {
      const res = await apiClient.get('/fees/receivables/follow-ups', {
        params: { grouping: followUpGrouping, limit: 30 },
      });
      if (res.data?.success) {
        setFollowUpItems(res.data.data.items || []);
        setFollowUpTierCounts(res.data.data.tierCounts || {});
      }
    } catch (err: any) {
      console.error('Failed to load follow-up queue', err);
      toast.error('Failed to load follow-up work queue');
    } finally {
      setFollowUpLoading(false);
    }
  }, [followUpGrouping]);

  // Load Student Detail
  const fetchStudentDetail = useCallback(async (studentId: string) => {
    setSelectedStudentId(studentId);
    setStudentDetailLoading(true);
    try {
      const res = await apiClient.get(`/fees/receivables/students/${studentId}`);
      if (res.data?.success) {
        setStudentDetail(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load student receivable detail', err);
      toast.error('Failed to load student detail');
      setSelectedStudentId(null);
    } finally {
      setStudentDetailLoading(false);
    }
  }, []);

  // Initial Fetch
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (activeTab === 'register') {
      fetchRegister();
    } else if (activeTab === 'ageing') {
      fetchAgeing();
    } else if (activeTab === 'collections') {
      fetchPerformance();
    } else if (activeTab === 'follow_ups') {
      fetchFollowUpQueue();
    }
  }, [activeTab, fetchRegister, fetchAgeing, fetchPerformance, fetchFollowUpQueue]);

  // Drilldown from Ageing Bucket into Register
  const handleBucketDrilldown = (bucketKey: string) => {
    setSelectedBucket(bucketKey);
    setActiveTab('register');
    setRegisterPage(1);
  };

  // CSV Export for Register
  const exportRegisterCsv = () => {
    if (!registerItems.length) {
      toast.error('No items to export');
      return;
    }
    const headers = [
      'Admission No',
      'Student Name',
      'Grade',
      'Fee Component',
      'Term',
      'Assessed',
      'Paid',
      'Outstanding',
      'Due Date',
      'Days Overdue',
      'Status',
    ];
    const rows = registerItems.map((i) => [
      i.admission_no,
      `"${i.student_name}"`,
      `"${i.grade_name}"`,
      `"${i.component_name}"`,
      `"${i.term_name}"`,
      i.original_assessed_amount,
      i.paid_amount,
      i.outstanding_amount,
      i.due_date,
      i.days_overdue,
      i.receivable_status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `receivables_register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Receivables register exported successfully');
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'Settled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Settled
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" /> Overdue
          </span>
        );
      case 'Due Today':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Due Today
          </span>
        );
      case 'Partially Paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <CreditCard className="w-3 h-3" /> Partially Paid
          </span>
        );
      case 'Waived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            Waived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            Not Yet Due
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-xl text-white shadow-lg shadow-amber-500/20">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Receivables & Collections
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Institutional fee ledger command center, ageing analysis, and collection work queue
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchSummary();
              if (activeTab === 'register') fetchRegister();
              if (activeTab === 'ageing') fetchAgeing();
              if (activeTab === 'collections') fetchPerformance();
              if (activeTab === 'follow_ups') fetchFollowUpQueue();
              toast.success('Data refreshed');
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/10 space-x-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
            activeTab === 'overview'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-semibold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('register')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
            activeTab === 'register'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-semibold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          Receivables Register
        </button>
        <button
          onClick={() => setActiveTab('ageing')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
            activeTab === 'ageing'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-semibold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Ageing Analysis
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
            activeTab === 'collections'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-semibold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <PieChart className="w-4 h-4" />
          Collection Performance
        </button>
        <button
          onClick={() => setActiveTab('follow_ups')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
            activeTab === 'follow_ups'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-semibold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          Follow-Up Work Queue
          {summary && summary.overdueAccountsCount > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              {summary.overdueAccountsCount}
            </span>
          )}
        </button>
      </div>

      {/* =========================================================================
          SCREEN A: RECEIVABLES OVERVIEW
         ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {summaryLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`${GLASS_CARD} p-5 h-28 animate-pulse bg-slate-100 dark:bg-slate-800/40`} />
              ))}
            </div>
          ) : summary ? (
            <>
              {/* Primary KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`${GLASS_CARD} p-5 hover:border-amber-500/30 transition`}>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm">
                    <span>Total Outstanding</span>
                    <Coins className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(summary.totalOutstanding, summary.currencyCode)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Across {summary.studentsWithOutstanding} students with dues
                  </div>
                </div>

                <div className={`${GLASS_CARD} p-5 hover:border-rose-500/30 transition`}>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm">
                    <span>Total Overdue</span>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(summary.totalOverdue, summary.currencyCode)}
                  </div>
                  <div className="mt-1 text-xs text-rose-500 font-medium">
                    {summary.overdueAccountsCount} accounts require immediate follow-up
                  </div>
                </div>

                <div className={`${GLASS_CARD} p-5 hover:border-blue-500/30 transition`}>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm">
                    <span>Due in Next 7 Days</span>
                    <Clock className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(summary.dueInNext7Days, summary.currencyCode)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Upcoming milestone obligations</div>
                </div>

                <div className={`${GLASS_CARD} p-5 hover:border-purple-500/30 transition`}>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm">
                    <span>Due in Next 30 Days</span>
                    <Calendar className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(summary.dueInNext30Days, summary.currencyCode)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Near-term receivables forecast</div>
                </div>
              </div>

              {/* Secondary Metric Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`${GLASS_CARD} p-5`}>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm">
                    <span>Collected This Month</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(summary.collectedThisMonth, summary.currencyCode)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Confirmed successful transactions</div>
                </div>

                <div className={`${GLASS_CARD} p-5`}>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm">
                    <span>Collection Rate</span>
                    <Percent className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {summary.collectionRate.toFixed(1)}%
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {formatCurrency(summary.totalAllocatedPaid, summary.currencyCode)} of {formatCurrency(summary.totalOutstanding + summary.totalAllocatedPaid, summary.currencyCode)}
                  </div>
                </div>

                <div className={`${GLASS_CARD} p-5`}>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm">
                    <span>Students with Outstanding</span>
                    <User className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {summary.studentsWithOutstanding}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Students with unpaid balances</div>
                </div>

                <div className={`${GLASS_CARD} p-5`}>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-sm">
                    <span>Overdue Accounts</span>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
                    {summary.overdueAccountsCount}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Priority for collection outreach</div>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className={`${GLASS_CARD} p-6`}>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
                  Receivables Management Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      setSelectedStatus('Overdue');
                      setActiveTab('register');
                    }}
                    className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                        View Overdue Register
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Filter list to overdue accounts only</div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-amber-500 transition" />
                  </button>

                  <button
                    onClick={() => setActiveTab('ageing')}
                    className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        Overdue Ageing Breakdown
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Inspect ageing brackets (30, 60, 90+ days)</div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition" />
                  </button>

                  <button
                    onClick={() => setActiveTab('follow_ups')}
                    className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                        Open Follow-Up Work Queue
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Review prioritized high-risk accounts</div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className={`${GLASS_CARD} p-12 text-center text-slate-500`}>
              No receivables data available
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SCREEN B: RECEIVABLES REGISTER
         ========================================================================= */}
      {activeTab === 'register' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className={`${GLASS_CARD} p-4 flex flex-col md:flex-row gap-3 items-center justify-between`}>
            <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name or admission no..."
                  value={registerSearch}
                  onChange={(e) => {
                    setRegisterSearch(e.target.value);
                    setRegisterPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setRegisterPage(1);
                }}
                className="px-3 py-2 text-sm bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Statuses</option>
                <option value="Overdue">Overdue Only</option>
                <option value="Due Today">Due Today</option>
                <option value="Not Yet Due">Not Yet Due</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Settled">Settled</option>
                <option value="Waived">Waived</option>
              </select>

              {/* Ageing Bucket Filter */}
              <select
                value={selectedBucket}
                onChange={(e) => {
                  setSelectedBucket(e.target.value);
                  setRegisterPage(1);
                }}
                className="px-3 py-2 text-sm bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Ageing Buckets</option>
                <option value="CURRENT">Not Yet Due</option>
                <option value="OVERDUE_1_7">1–7 Days Overdue</option>
                <option value="OVERDUE_8_30">8–30 Days Overdue</option>
                <option value="OVERDUE_31_60">31–60 Days Overdue</option>
                <option value="OVERDUE_61_90">61–90 Days Overdue</option>
                <option value="OVERDUE_90_PLUS">&gt; 90 Days Overdue</option>
              </select>

              {(selectedStatus !== 'all' || selectedBucket !== 'all' || registerSearch) && (
                <button
                  onClick={() => {
                    setSelectedStatus('all');
                    setSelectedBucket('all');
                    setRegisterSearch('');
                    setRegisterPage(1);
                  }}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline px-2 py-1"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <button
              onClick={exportRegisterCsv}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {/* Table Container */}
          <div className={`${GLASS_CARD} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Student / Admission</th>
                    <th className="px-4 py-3.5">Grade</th>
                    <th className="px-4 py-3.5">Fee Component</th>
                    <th className="px-4 py-3.5">Installment</th>
                    <th className="px-4 py-3.5 text-right">Assessed</th>
                    <th className="px-4 py-3.5 text-right">Paid</th>
                    <th className="px-4 py-3.5 text-right">Outstanding</th>
                    <th className="px-4 py-3.5">Due Date</th>
                    <th className="px-4 py-3.5">Days Past Due</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {registerLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={11} className="h-14 bg-slate-50/50 dark:bg-slate-800/20" />
                      </tr>
                    ))
                  ) : registerItems.length > 0 ? (
                    registerItems.map((item) => (
                      <tr
                        key={item.student_charge_due_id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => fetchStudentDetail(item.student_id)}
                            className="font-medium text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 text-left transition"
                          >
                            {item.student_name}
                          </button>
                          <div className="text-xs text-slate-400">{item.admission_no}</div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                          {item.grade_name}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                          {item.component_name}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-xs">
                          {item.term_name}
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-slate-900 dark:text-white">
                          {formatCurrency(item.original_assessed_amount)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.paid_amount)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.outstanding_amount)}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">
                          {item.due_date}
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          {item.days_overdue > 0 ? (
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                              {item.days_overdue} days
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {statusBadge(item.receivable_status)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => fetchStudentDetail(item.student_id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="View student ledger details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-500">
                        No receivable obligations found matching criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing {registerItems.length} of {registerTotal} obligations
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={registerPage <= 1}
                  onClick={() => setRegisterPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>
                  Page {registerPage} of {registerTotalPages}
                </span>
                <button
                  disabled={registerPage >= registerTotalPages}
                  onClick={() => setRegisterPage((p) => Math.min(registerTotalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN C: OVERDUE AGEING ANALYSIS
         ========================================================================= */}
      {activeTab === 'ageing' && (
        <div className="space-y-6">
          {/* Overview Banner */}
          <div className={`${GLASS_CARD} p-6 flex flex-col md:flex-row items-center justify-between gap-4`}>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Institutional Ageing Analysis
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Mutual-exclusive ageing buckets based on calendar due dates. Click any card to drill down into the receivables register.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-xs text-slate-400">Total Outstanding</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(ageingTotalOutstanding)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-rose-500 font-medium">Total Overdue</div>
                <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(ageingTotalOverdue)}
                </div>
              </div>
            </div>
          </div>

          {/* Ageing Bucket Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ageingBuckets.map((bucket) => {
              const isCurrent = bucket.bucketKey === 'CURRENT';
              return (
                <div
                  key={bucket.bucketKey}
                  onClick={() => handleBucketDrilldown(bucket.bucketKey)}
                  className={`${GLASS_CARD} p-5 cursor-pointer hover:border-amber-500/50 hover:shadow-md transition relative overflow-hidden group`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                      {bucket.bucketLabel}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition" />
                  </div>

                  <div className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(bucket.outstandingAmount)}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{bucket.dueCount} Dues</span>
                    <span>{bucket.studentCount} Students</span>
                  </div>

                  {/* Progress Bar of Total */}
                  <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isCurrent
                          ? 'bg-slate-400'
                          : bucket.bucketKey === 'OVERDUE_90_PLUS'
                          ? 'bg-rose-600'
                          : bucket.bucketKey === 'OVERDUE_61_90'
                          ? 'bg-rose-500'
                          : bucket.bucketKey === 'OVERDUE_31_60'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, bucket.percentageOfTotal)}%` }}
                    />
                  </div>

                  <div className="mt-2 text-right text-xs text-slate-400">
                    {bucket.percentageOfTotal.toFixed(1)}% of total portfolio
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Ageing Table */}
          <div className={`${GLASS_CARD} overflow-hidden`}>
            <div className="p-4 border-b border-slate-200 dark:border-white/10 font-semibold text-slate-900 dark:text-white">
              Ageing Summary Table
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Ageing Bracket</th>
                    <th className="px-6 py-3.5 text-right">Outstanding Amount</th>
                    <th className="px-6 py-3.5 text-right">Dues Count</th>
                    <th className="px-6 py-3.5 text-right">Affected Students</th>
                    <th className="px-6 py-3.5 text-right">% of Total Balance</th>
                    <th className="px-6 py-3.5 text-right">% of Overdue</th>
                    <th className="px-6 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {ageingBuckets.map((b) => (
                    <tr key={b.bucketKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {b.bucketLabel}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(b.outstandingAmount)}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                        {b.dueCount}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                        {b.studentCount}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                        {b.percentageOfTotal.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
                        {b.bucketKey === 'CURRENT' ? '—' : `${b.percentageOfOverdue.toFixed(1)}%`}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleBucketDrilldown(b.bucketKey)}
                          className="px-3 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 transition"
                        >
                          Filter Register
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN D: COLLECTION PERFORMANCE
         ========================================================================= */}
      {activeTab === 'collections' && (
        <div className="space-y-6">
          {/* Period Selector Bar */}
          <div className={`${GLASS_CARD} p-4 flex flex-col md:flex-row items-center justify-between gap-4`}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Reporting Period:
              </span>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
                {(['today', 'this_week', 'this_month', 'this_academic_year'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCollectionsPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg transition capitalize ${
                      collectionsPeriod === p
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {p.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {performance && (
              <div className="text-xs text-slate-500">
                Period Range: {performance.startDate} to {performance.endDate}
              </div>
            )}
          </div>

          {performanceLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`${GLASS_CARD} p-6 h-32 animate-pulse bg-slate-100 dark:bg-slate-800/40`} />
              ))}
            </div>
          ) : performance ? (
            <>
              {/* Primary Collection KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`${GLASS_CARD} p-6`}>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    Gross Collections
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(performance.grossCollectedAmount)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {performance.transactionCount} confirmed payment transactions
                  </div>
                </div>

                <div className={`${GLASS_CARD} p-6`}>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    Online Gateway Collections
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                    {formatCurrency(performance.onlineCollectionsAmount)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Razorpay & automated gateway captures
                  </div>
                </div>

                <div className={`${GLASS_CARD} p-6`}>
                  <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    Offline / Counter Collections
                  </div>
                  <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(performance.offlineCollectionsAmount)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Cash, cheques, DDs, and direct transfers
                  </div>
                </div>
              </div>

              {/* Collections by Grade & Component Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By Grade */}
                <div className={`${GLASS_CARD} p-6 space-y-4`}>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Collections by Grade
                  </h3>
                  <div className="space-y-3">
                    {performance.collectionsByGrade.length > 0 ? (
                      performance.collectionsByGrade.map((g) => {
                        const pct = performance.grossCollectedAmount > 0
                          ? (g.amount / performance.grossCollectedAmount) * 100
                          : 0;
                        return (
                          <div key={g.gradeId} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {g.gradeName}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {formatCurrency(g.amount)} ({pct.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-sm text-slate-400 py-6 text-center">
                        No grade collection records in this period
                      </div>
                    )}
                  </div>
                </div>

                {/* By Fee Component */}
                <div className={`${GLASS_CARD} p-6 space-y-4`}>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Collections Attributed by Fee Component
                  </h3>
                  <div className="space-y-3">
                    {performance.collectionsByComponent.length > 0 ? (
                      performance.collectionsByComponent.map((c) => {
                        const pct = performance.grossCollectedAmount > 0
                          ? (c.amount / performance.grossCollectedAmount) * 100
                          : 0;
                        return (
                          <div key={c.componentId} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {c.componentName}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {formatCurrency(c.amount)} ({pct.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full"
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-sm text-slate-400 py-6 text-center">
                        No component collection records in this period
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Method Distribution */}
              <div className={`${GLASS_CARD} p-6`}>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                  Payment Method Breakdown
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {performance.paymentMethodBreakdown.map((m) => (
                    <div
                      key={m.method}
                      className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30"
                    >
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        {m.method}
                      </div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                        {formatCurrency(m.amount)}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{m.count} transactions</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* =========================================================================
          SCREEN F: COLLECTIONS FOLLOW-UP WORK QUEUE
         ========================================================================= */}
      {activeTab === 'follow_ups' && (
        <div className="space-y-4">
          {/* Priority Tabs */}
          <div className={`${GLASS_CARD} p-3 flex flex-wrap gap-2 items-center justify-between`}>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFollowUpGrouping('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  followUpGrouping === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                All Accounts ({followUpTierCounts.all || 0})
              </button>
              <button
                onClick={() => setFollowUpGrouping('high_outstanding')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  followUpGrouping === 'high_outstanding'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                }`}
              >
                High Balance &ge; ₹10k ({followUpTierCounts.high_outstanding || 0})
              </button>
              <button
                onClick={() => setFollowUpGrouping('long_overdue')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  followUpGrouping === 'long_overdue'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                }`}
              >
                Long Overdue &gt; 60 Days ({followUpTierCounts.long_overdue || 0})
              </button>
              <button
                onClick={() => setFollowUpGrouping('newly_overdue')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  followUpGrouping === 'newly_overdue'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                }`}
              >
                Newly Overdue 1–7 Days ({followUpTierCounts.newly_overdue || 0})
              </button>
              <button
                onClick={() => setFollowUpGrouping('due_soon')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  followUpGrouping === 'due_soon'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
                }`}
              >
                Due Next 7 Days ({followUpTierCounts.due_soon || 0})
              </button>
            </div>

            <div className="text-xs text-slate-500 italic flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              Prioritized read-only work queue
            </div>
          </div>

          {/* Queue Table */}
          <div className={`${GLASS_CARD} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-6 py-3.5">Grade</th>
                    <th className="px-6 py-3.5 text-right">Total Outstanding</th>
                    <th className="px-6 py-3.5 text-right">Overdue Amount</th>
                    <th className="px-6 py-3.5 text-right">Days Past Due</th>
                    <th className="px-6 py-3.5">Priority Tier</th>
                    <th className="px-6 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {followUpLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={7} className="h-14 bg-slate-50/50 dark:bg-slate-800/20" />
                      </tr>
                    ))
                  ) : followUpItems.length > 0 ? (
                    followUpItems.map((item) => (
                      <tr
                        key={item.student_id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                      >
                        <td className="px-6 py-4">
                          <button
                            onClick={() => fetchStudentDetail(item.student_id)}
                            className="font-medium text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 text-left transition"
                          >
                            {item.student_name}
                          </button>
                          <div className="text-xs text-slate-400">{item.admission_no}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {item.grade_name} {item.section_name !== 'N/A' && `(${item.section_name})`}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.total_outstanding)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-rose-600 dark:text-rose-400">
                          {formatCurrency(item.total_overdue)}
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          {item.days_overdue > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              {item.days_overdue} days
                            </span>
                          ) : (
                            <span className="text-slate-400">Upcoming</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {item.priority_tier === 'HIGH_RISK' ? (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              High Risk (60+d)
                            </span>
                          ) : item.priority_tier === 'HIGH_VALUE' ? (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              High Value (&ge; ₹10k)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                              Standard
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => fetchStudentDetail(item.student_id)}
                            className="px-3 py-1 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition"
                          >
                            View Account
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No overdue accounts in this priority tier
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN E: STUDENT RECEIVABLES DETAIL MODAL / DRAWER
         ========================================================================= */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex justify-end transition-opacity">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Student Receivables Profile
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authoritative student dues, transaction history, and concessions
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentId(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {studentDetailLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                  <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                </div>
              ) : studentDetail ? (
                <>
                  {/* Student Identity Card */}
                  <div className={`${GLASS_CARD} p-5 flex items-center justify-between`}>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                        {studentDetail.student.full_name}
                      </h4>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span>Admission No: <strong className="text-slate-700 dark:text-slate-300">{studentDetail.student.admission_no}</strong></span>
                        <span>•</span>
                        <span>Grade: <strong className="text-slate-700 dark:text-slate-300">{studentDetail.student.grade_name}</strong></span>
                        <span>•</span>
                        <span>Year: <strong className="text-slate-700 dark:text-slate-300">{studentDetail.student.academic_year_name}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Ledger Balance Summary Grid */}
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
                      <div className="text-xs text-slate-500">Total Assessed</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {formatCurrency(studentDetail.summary.totalAssessed)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
                      <div className="text-xs text-slate-500">Total Paid</div>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {formatCurrency(studentDetail.summary.totalPaid)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
                      <div className="text-xs text-slate-500">Outstanding</div>
                      <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">
                        {formatCurrency(studentDetail.summary.totalOutstanding)}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
                      <div className="text-xs text-slate-500">Overdue</div>
                      <div className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-1">
                        {formatCurrency(studentDetail.summary.totalOverdue)}
                      </div>
                    </div>
                  </div>

                  {/* Dues Obligations Breakdown */}
                  <div className="space-y-3">
                    <h5 className="font-semibold text-slate-900 dark:text-white text-sm">
                      Payable Fee Obligations
                    </h5>
                    <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-500">
                          <tr>
                            <th className="px-4 py-2.5">Component</th>
                            <th className="px-4 py-2.5">Term</th>
                            <th className="px-4 py-2.5 text-right">Due Amt</th>
                            <th className="px-4 py-2.5 text-right">Paid</th>
                            <th className="px-4 py-2.5 text-right">Outstanding</th>
                            <th className="px-4 py-2.5">Due Date</th>
                            <th className="px-4 py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                          {studentDetail.dues.map((d: any) => (
                            <tr key={d.student_charge_due_id}>
                              <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                                {d.component_name}
                              </td>
                              <td className="px-4 py-2.5 text-slate-500">{d.term_name}</td>
                              <td className="px-4 py-2.5 text-right">{formatCurrency(d.amount_due)}</td>
                              <td className="px-4 py-2.5 text-right text-emerald-600">{formatCurrency(d.paid_amount)}</td>
                              <td className="px-4 py-2.5 text-right font-bold">{formatCurrency(d.outstanding_amount)}</td>
                              <td className="px-4 py-2.5 text-slate-500">{d.due_date}</td>
                              <td className="px-4 py-2.5">{statusBadge(d.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Confirmed Payments History */}
                  <div className="space-y-3">
                    <h5 className="font-semibold text-slate-900 dark:text-white text-sm">
                      Confirmed Payment History
                    </h5>
                    {studentDetail.paymentHistory.length > 0 ? (
                      <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-500">
                            <tr>
                              <th className="px-4 py-2.5">Date</th>
                              <th className="px-4 py-2.5">Method</th>
                              <th className="px-4 py-2.5 text-right">Amount</th>
                              <th className="px-4 py-2.5">Order Ref</th>
                              <th className="px-4 py-2.5">Gateway Reference</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {studentDetail.paymentHistory.map((p: any) => (
                              <tr key={p.payment_transaction_id}>
                                <td className="px-4 py-2.5 font-medium">{p.transaction_date}</td>
                                <td className="px-4 py-2.5 uppercase">{p.payment_method}</td>
                                <td className="px-4 py-2.5 text-right font-bold text-emerald-600">
                                  {formatCurrency(p.amount)}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-slate-500">{p.order_reference}</td>
                                <td className="px-4 py-2.5 font-mono text-slate-400">{p.gateway_transaction_id || 'Direct'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 text-xs text-slate-400 text-center">
                        No payments recorded for this student yet
                      </div>
                    )}
                  </div>

                  {/* Applied Concessions */}
                  {studentDetail.concessions.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Scholarships & Concessions
                      </h5>
                      <div className="space-y-2">
                        {studentDetail.concessions.map((c: any) => (
                          <div
                            key={c.scholarship_concession_id}
                            className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {c.concession_name}
                              </div>
                              <div className="text-slate-400 uppercase mt-0.5">{c.scholarship_type} • {c.scope}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-purple-600 dark:text-purple-400">
                                {c.approved_percentage || c.concession_percentage}% Discount
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 capitalize">
                                {c.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedStudentId(null)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceivablesCollections;
