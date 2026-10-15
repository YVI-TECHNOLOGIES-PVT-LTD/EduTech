import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  Search,
  Filter,
  FileSpreadsheet,
  Coins,
  Receipt,
  Scale,
  Award,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  Lock,
  Layers,
  ArrowUpDown,
  FileText,
  AlertCircle,
  HelpCircle,
  Compass,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  ShieldCheck,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { apiClient } from '../../../lib/api-client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================
type OperationsTab =
  | 'overview'
  | 'collections'
  | 'receivables'
  | 'exceptions'
  | 'data_quality'
  | 'exports';

interface ExecutiveOverviewData {
  reporting_period: {
    start_date: string | null;
    end_date: string | null;
    academic_year_id: string | null;
    reporting_date: string;
  };
  collections: {
    total_collected: number;
    successful_count: number;
    pending_amount: number;
    pending_count: number;
    failed_amount: number;
    failed_count: number;
    currency_code: string;
  };
  receivables: {
    total_assessed: number;
    total_allocated: number;
    total_outstanding: number;
    total_overdue: number;
    total_current_due: number;
    total_undated_due: number;
    students_with_outstanding: number;
    currency_code: string;
  };
  performance: {
    collection_rate_percentage: number;
    rate_basis: string;
    formula_description: string;
  };
  exceptions: {
    total_exceptions_count: number;
    unallocated_payments_count: number;
    unallocated_payments_amount: number;
    reconciliation_exceptions_count: number;
    failed_webhooks_count: number;
    settlement_exceptions_count: number;
    pending_concession_reviews: number;
  };
  concessions: {
    pending_review_count: number;
    approved_count: number;
    applied_count: number;
    exposure_disclosure: string;
  };
  data_readiness: {
    status: 'AVAILABLE' | 'PARTIAL' | 'NEEDS_ATTENTION';
    readiness_score: number;
    disclaimer: string;
  };
}

interface CollectionsData {
  total_successful_amount: number;
  total_successful_count: number;
  average_transaction_amount: number;
  currency_code: string;
  by_payment_method: Array<{
    payment_method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  collections_over_time: Array<{
    period_key: string;
    period_label: string;
    count: number;
    amount: number;
  }>;
  by_fee_component: Array<{
    component_id: string;
    component_name: string;
    allocated_amount: number;
    transaction_count: number;
  }>;
  by_academic_year: Array<{
    academic_year_id: string;
    academic_year_name: string;
    count: number;
    amount: number;
  }>;
}

interface ReceivablesData {
  total_outstanding: number;
  total_overdue: number;
  total_current: number;
  total_undated: number;
  currency_code: string;
  ageing_buckets: Array<{
    bucket_key: string;
    label: string;
    amount: number;
    dues_count: number;
    student_count: number;
    percentage: number;
  }>;
  breakdown_by_grade: Array<{
    grade_id: string;
    grade_name: string;
    student_count: number;
    outstanding_amount: number;
  }>;
  drilldown_url: string;
}

interface ExceptionItem {
  id: string;
  record_id: string;
  source_module: string;
  category: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  detected_at: string | null;
  description: string;
  source_status: string;
  drilldown_url: string;
}

interface ExceptionsData {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: ExceptionItem[];
}

interface DataQualityData {
  overall_status: string;
  readiness_score: number;
  evaluated_controls_count: number;
  available_controls: number;
  partial_controls: number;
  blocked_controls: number;
  controls: Array<{
    dimension: string;
    label: string;
    status: 'AVAILABLE' | 'PARTIAL' | 'BLOCKED';
    records_evaluated: number;
    details: string;
  }>;
  schema_freeze_limitation: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export const FinanceOperations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OperationsTab>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [exceptionCategory, setExceptionCategory] = useState<string>('all');
  const [exceptionSeverity, setExceptionSeverity] = useState<string>('all');
  const [exceptionPage, setExceptionPage] = useState<number>(1);

  // Data states
  const [overview, setOverview] = useState<ExecutiveOverviewData | null>(null);
  const [collections, setCollections] = useState<CollectionsData | null>(null);
  const [receivables, setReceivables] = useState<ReceivablesData | null>(null);
  const [exceptions, setExceptions] = useState<ExceptionsData | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQualityData | null>(null);

  const formatCurrency = (val: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.set('startDate', startDate);
      if (endDate) queryParams.set('endDate', endDate);
      if (academicYearId) queryParams.set('academicYearId', academicYearId);

      const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';

      // Parallel fetch of operations data
      const [ovRes, collRes, recRes, dqRes] = await Promise.all([
        apiClient.get<any>(`/fees/operations/overview${queryStr}`),
        apiClient.get<any>(`/fees/operations/collections${queryStr}`),
        apiClient.get<any>(`/fees/operations/receivables${queryStr}`),
        apiClient.get<any>(`/fees/operations/data-quality`)
      ]);

      if (ovRes?.data?.data) setOverview(ovRes.data.data);
      if (collRes?.data?.data) setCollections(collRes.data.data);
      if (recRes?.data?.data) setReceivables(recRes.data.data);
      if (dqRes?.data?.data) setDataQuality(dqRes.data.data);

      // Load exceptions
      await loadExceptions(1, exceptionCategory, exceptionSeverity);
    } catch (err: any) {
      console.error('[FinanceOperations] Failed to load operations data:', err);
      toast.error('Failed to load finance operations insights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExceptions = async (page: number, category: string, severity: string) => {
    try {
      const q = new URLSearchParams({
        page: String(page),
        limit: '15'
      });
      if (category && category !== 'all') q.set('category', category);
      if (severity && severity !== 'all') q.set('severity', severity);

      const res = await apiClient.get<any>(`/fees/operations/exceptions?${q.toString()}`);
      if (res?.data?.data) {
        setExceptions(res.data.data);
      }
    } catch (err) {
      console.error('[FinanceOperations] Failed to load exceptions:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate, academicYearId]);

  const handlePageChange = (newPage: number) => {
    setExceptionPage(newPage);
    loadExceptions(newPage, exceptionCategory, exceptionSeverity);
  };

  const handleFilterExceptions = (category: string, severity: string) => {
    setExceptionCategory(category);
    setExceptionSeverity(severity);
    setExceptionPage(1);
    loadExceptions(1, category, severity);
  };

  const handleExport = async (type: 'overview' | 'collections' | 'receivables' | 'exceptions') => {
    setIsExporting(true);
    try {
      const q = new URLSearchParams({ type });
      if (startDate) q.set('startDate', startDate);
      if (endDate) q.set('endDate', endDate);
      if (academicYearId) q.set('academicYearId', academicYearId);

      const res = await apiClient.get(`/fees/operations/export?${q.toString()}`, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `finance_operations_${type}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${type} operations report successfully.`);
    } catch (err: any) {
      console.error('[FinanceOperations] CSV Export failed:', err);
      toast.error('Failed to export operational report.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 space-y-6">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Finance Operations & Insights</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Stage 4 Phase 15
                </span>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Schema Freeze Enforced
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Consolidated operational visibility, collections performance, receivables ageing, and priority exception queue.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none"
              title="Start Date"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none"
              title="End Date"
            />
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => handleExport(activeTab === 'collections' ? 'collections' : activeTab === 'receivables' ? 'receivables' : activeTab === 'exceptions' ? 'exceptions' : 'overview')}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* ── KPI HIGHLIGHT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Collections */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Collections</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {formatCurrency(overview?.collections.total_collected || 0, overview?.collections.currency_code)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-700/40 pt-2">
            <span>{overview?.collections.successful_count || 0} Successful Transactions</span>
            <span className="text-amber-400">{formatCurrency(overview?.collections.pending_amount || 0)} Pending</span>
          </div>
        </div>

        {/* KPI 2: Outstanding Receivables */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Outstanding Receivables</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {formatCurrency(overview?.receivables.total_outstanding || 0, overview?.receivables.currency_code)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-700/40 pt-2">
            <span className="text-rose-400">{formatCurrency(overview?.receivables.total_overdue || 0)} Overdue</span>
            <span>{overview?.receivables.students_with_outstanding || 0} Students</span>
          </div>
        </div>

        {/* KPI 3: Collection Realization Rate */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Realization Rate</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {overview?.performance.collection_rate_percentage || 0}%
            </span>
            <span className="text-xs text-slate-400">of active demand</span>
          </div>
          <div className="mt-2 w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, overview?.performance.collection_rate_percentage || 0))}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-700/40 pt-1.5">
            <span>{formatCurrency(overview?.receivables.total_allocated || 0)} Allocated</span>
            <span className="text-slate-400">Total Assessed: {formatCurrency(overview?.receivables.total_assessed || 0)}</span>
          </div>
        </div>

        {/* KPI 4: Exceptions & Concessions */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Exceptions Queue</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">
              {overview?.exceptions.total_exceptions_count || 0}
            </span>
            <span className="text-xs text-slate-400">requiring review</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-700/40 pt-2">
            <span>{overview?.exceptions.unallocated_payments_count || 0} Unallocated Funds</span>
            <span className="text-indigo-400">{overview?.concessions.pending_review_count || 0} Pending Concessions</span>
          </div>
        </div>
      </div>

      {/* ── WORKSPACE TABS ── */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Executive Summary', icon: Compass },
          { id: 'collections', label: 'Collections Performance', icon: Coins },
          { id: 'receivables', label: 'Receivables & Ageing', icon: BarChart3 },
          { id: 'exceptions', label: 'Exception Action Center', icon: AlertTriangle, badge: overview?.exceptions.total_exceptions_count },
          { id: 'data_quality', label: 'Data Quality & Readiness', icon: ShieldCheck },
          { id: 'exports', label: 'Export Center', icon: FileSpreadsheet }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as OperationsTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-semibold border border-amber-500/30">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-sm font-medium">Aggregating transactional insights and operational metrics...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: EXECUTIVE SUMMARY */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial Snapshot & Quick Drilldowns */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Operations Balance Gauge */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-indigo-400" />
                    Demand & Allocation Breakdown
                  </h3>
                  <p className="text-xs text-slate-400">
                    Distribution of total student charge dues between allocated collections, active current dues, and overdue balances.
                  </p>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Allocated Paid', value: overview?.receivables.total_allocated || 0 },
                            { name: 'Current Due', value: overview?.receivables.total_current_due || 0 },
                            { name: 'Overdue Dues', value: overview?.receivables.total_overdue || 0 },
                            { name: 'Undated Dues', value: overview?.receivables.total_undated_due || 0 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#3b82f6" />
                          <Cell fill="#ef4444" />
                          <Cell fill="#64748b" />
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                          formatter={(value: any) => formatCurrency(Number(value))}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-700/40 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-300">Allocated Paid</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="text-slate-300">Current Due</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-slate-300">Overdue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                      <span className="text-slate-300">Undated</span>
                    </div>
                  </div>
                </div>

                {/* Modules Navigation Matrix */}
                <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Specialized Finance Workspace Directory
                  </h3>
                  <p className="text-xs text-slate-400">
                    Directly access dedicated Phase 8–14 workspaces to investigate variances, execute reconciliations, and review audits.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {[
                      {
                        title: 'Receivables & Collections',
                        url: '/app/finance/receivables',
                        desc: 'Student dues management, follow-up queues, and fee collection aging.',
                        icon: Receipt,
                        phase: 'Phase 8'
                      },
                      {
                        title: 'Finance Reconciliation',
                        url: '/app/finance/reconciliation',
                        desc: 'Settlement matching, unallocated gateway resolution, and run triggers.',
                        icon: Scale,
                        phase: 'Phase 10'
                      },
                      {
                        title: 'Accounting Readiness',
                        url: '/app/finance/accounting',
                        desc: 'Journal preparation, exception clearing, and trial balance readiness.',
                        icon: BookOpen,
                        phase: 'Phase 11'
                      },
                      {
                        title: 'Financial Reports & Intelligence',
                        url: '/app/finance/reports',
                        desc: 'Historical financial reporting, cash closing, and collection trends.',
                        icon: FileText,
                        phase: 'Phase 12'
                      },
                      {
                        title: 'Budgeting & Financial Planning',
                        url: '/app/finance/planning',
                        desc: 'Forecast scenarios, realization simulation, and academic year outlooks.',
                        icon: TrendingUp,
                        phase: 'Phase 13'
                      },
                      {
                        title: 'Finance Audit & Compliance',
                        url: '/app/finance/audit',
                        desc: 'Read-only governance, webhook tracking, and segregation of duties.',
                        icon: ShieldCheck,
                        phase: 'Phase 14'
                      }
                    ].map((mod, idx) => {
                      const Icon = mod.icon;
                      return (
                        <a
                          key={idx}
                          href={mod.url}
                          className="flex items-start gap-3 p-3 bg-slate-850 hover:bg-slate-700/60 border border-slate-700/50 rounded-lg transition-all group"
                        >
                          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 truncate">
                                {mod.title}
                              </h4>
                              <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                {mod.phase}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {mod.desc}
                            </p>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Concession Exposure Disclosure Banner */}
              <div className="p-4 bg-slate-800/30 border border-slate-700/60 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs space-y-1">
                  <h4 className="font-semibold text-slate-200">Financial Integrity & Concession Semantics</h4>
                  <p className="text-slate-400 leading-relaxed">
                    {overview?.concessions.exposure_disclosure} Current records track {overview?.concessions.approved_count || 0} approved concessions and {overview?.concessions.applied_count || 0} applied allocations. Student outstanding balances reflect post-concession assessments without duplicate deductions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COLLECTIONS PERFORMANCE */}
          {activeTab === 'collections' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Method Breakdown Chart */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-emerald-400" />
                      Collections by Payment Method
                    </span>
                    <span className="text-xs text-slate-400 font-normal">
                      Avg Tx: {formatCurrency(collections?.average_transaction_amount || 0)}
                    </span>
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={collections?.by_payment_method || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis type="number" stroke="#94a3b8" tickFormatter={(v) => `₹${v / 1000}k`} />
                        <YAxis type="category" dataKey="payment_method" stroke="#94a3b8" width={80} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                          formatter={(val: any) => formatCurrency(Number(val))}
                        />
                        <Bar dataKey="amount" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Timeline Chart */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    Monthly Collections Trend
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={collections?.collections_over_time || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="period_label" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" tickFormatter={(v) => `₹${v / 1000}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                          formatter={(val: any) => formatCurrency(Number(val))}
                        />
                        <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Fee Component Breakdown Table */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Collections by Fee Component
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700/80 text-slate-400 bg-slate-800/60">
                        <th className="p-3">Fee Component</th>
                        <th className="p-3 text-right">Transactions</th>
                        <th className="p-3 text-right">Allocated Collections</th>
                        <th className="p-3 text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {collections?.by_fee_component.map((fc, i) => {
                        const total = collections?.total_successful_amount || 1;
                        const pct = Math.round((fc.allocated_amount / total) * 1000) / 10;
                        return (
                          <tr key={i} className="hover:bg-slate-800/30">
                            <td className="p-3 font-medium text-slate-200">{fc.component_name}</td>
                            <td className="p-3 text-right text-slate-400">{fc.transaction_count}</td>
                            <td className="p-3 text-right font-semibold text-emerald-400">
                              {formatCurrency(fc.allocated_amount)}
                            </td>
                            <td className="p-3 text-right text-slate-300">{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RECEIVABLES & AGEING */}
          {activeTab === 'receivables' && (
            <div className="space-y-6">
              {/* Ageing Bucket Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {receivables?.ageing_buckets.map((b, i) => {
                  const isOverdue = b.bucket_key.startsWith('OVERDUE_');
                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border ${
                        isOverdue
                          ? 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                          : b.bucket_key === 'CURRENT'
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
                      }`}
                    >
                      <span className="text-[11px] font-medium block truncate" title={b.label}>
                        {b.label}
                      </span>
                      <span className="text-lg font-bold block mt-1 text-white">
                        {formatCurrency(b.amount)}
                      </span>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{b.student_count} Students</span>
                        <span>{b.percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ageing Chart & Grade Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-rose-400" />
                      Receivables Ageing Distribution
                    </span>
                    <a
                      href="/app/finance/receivables"
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      Drilldown to Receivables <ExternalLink className="w-3 h-3" />
                    </a>
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={receivables?.ageing_buckets || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="bucket_key" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" tickFormatter={(v) => `₹${v / 1000}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                          formatter={(val: any) => formatCurrency(Number(val))}
                        />
                        <Bar dataKey="amount" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Grade-level breakdown */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    Outstanding Receivables by Grade
                  </h3>
                  <div className="overflow-y-auto max-h-64">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-700/80 text-slate-400 bg-slate-800/60 sticky top-0">
                          <th className="p-2.5">Grade</th>
                          <th className="p-2.5 text-right">Students</th>
                          <th className="p-2.5 text-right">Outstanding Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {receivables?.breakdown_by_grade.map((g, i) => (
                          <tr key={i} className="hover:bg-slate-800/30">
                            <td className="p-2.5 font-medium text-slate-200">{g.grade_name}</td>
                            <td className="p-2.5 text-right text-slate-400">{g.student_count}</td>
                            <td className="p-2.5 text-right font-semibold text-rose-400">
                              {formatCurrency(g.outstanding_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXCEPTION ACTION CENTER */}
          {activeTab === 'exceptions' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                <div className="flex items-center gap-3">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={exceptionCategory}
                    onChange={(e) => handleFilterExceptions(e.target.value, exceptionSeverity)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                  >
                    <option value="all">All Exception Categories</option>
                    <option value="UNALLOCATED_FUNDS">Unallocated Funds</option>
                    <option value="SETTLEMENT_MISMATCH">Settlement Mismatches</option>
                    <option value="WEBHOOK_FAILURE">Webhook Failures</option>
                    <option value="PENDING_CONCESSION_APPROVAL">Pending Concession Approvals</option>
                  </select>

                  <select
                    value={exceptionSeverity}
                    onChange={(e) => handleFilterExceptions(exceptionCategory, e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                  >
                    <option value="all">All Severities</option>
                    <option value="HIGH">High Severity</option>
                    <option value="MEDIUM">Medium Severity</option>
                    <option value="LOW">Low Severity</option>
                  </select>
                </div>

                <span className="text-xs text-slate-400">
                  Showing {exceptions?.items.length || 0} of {exceptions?.total || 0} exceptions
                </span>
              </div>

              {/* Exceptions List */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700/80 text-slate-400 bg-slate-800/60">
                        <th className="p-3">Severity</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Module</th>
                        <th className="p-3">Description</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {exceptions?.items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            No exceptions detected matching the selected filters.
                          </td>
                        </tr>
                      ) : (
                        exceptions?.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/30">
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  item.severity === 'HIGH'
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    : item.severity === 'MEDIUM'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                }`}
                              >
                                {item.severity}
                              </span>
                            </td>
                            <td className="p-3 font-medium text-slate-200">{item.category}</td>
                            <td className="p-3 text-slate-400 uppercase text-[10px]">{item.source_module}</td>
                            <td className="p-3 text-slate-300 max-w-md">{item.description}</td>
                            <td className="p-3 text-slate-400">{item.source_status}</td>
                            <td className="p-3 text-right">
                              <a
                                href={item.drilldown_url}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] font-medium text-indigo-400 transition-colors"
                              >
                                Resolve <ExternalLink className="w-3 h-3" />
                              </a>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {exceptions && exceptions.total_pages > 1 && (
                  <div className="flex items-center justify-between p-3 border-t border-slate-700/60 text-xs text-slate-400">
                    <span>
                      Page {exceptions.page} of {exceptions.total_pages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(exceptions.page - 1)}
                        disabled={exceptions.page <= 1}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePageChange(exceptions.page + 1)}
                        disabled={exceptions.page >= exceptions.total_pages}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: DATA QUALITY & READINESS */}
          {activeTab === 'data_quality' && (
            <div className="space-y-6">
              {/* Readiness Rating Card */}
              <div className="p-5 bg-slate-800/40 border border-slate-700/60 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Overall Data Quality Score</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Evaluates completeness, tenant scoping, and readiness across 7 financial operational dimensions.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-2xl font-bold text-indigo-400">{dataQuality?.readiness_score || 0}%</span>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider">
                      {dataQuality?.overall_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* 7 Dimensions Matrix */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700/80 text-slate-400 bg-slate-800/60">
                      <th className="p-3">Dimension</th>
                      <th className="p-3">Operational Status</th>
                      <th className="p-3 text-right">Records Evaluated</th>
                      <th className="p-3">Details & Schema Freeze Limitation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {dataQuality?.controls.map((ctrl, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="p-3 font-semibold text-slate-200">{ctrl.label}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              ctrl.status === 'AVAILABLE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : ctrl.status === 'PARTIAL'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {ctrl.status}
                          </span>
                        </td>
                        <td className="p-3 text-right text-slate-300">{ctrl.records_evaluated}</td>
                        <td className="p-3 text-slate-400 leading-relaxed">{ctrl.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: EXPORT CENTER */}
          {activeTab === 'exports' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  id: 'overview',
                  title: 'Executive Finance Overview CSV',
                  desc: 'High-level KPI summary covering total collections, outstanding receivables, overdue balances, realization rate, and active exceptions.',
                  type: 'overview' as const
                },
                {
                  id: 'collections',
                  title: 'Collections Performance Breakdown CSV',
                  desc: 'Granular payment method, timeline, fee component, and academic year collections breakdown.',
                  type: 'collections' as const
                },
                {
                  id: 'receivables',
                  title: 'Receivables & Ageing Analysis CSV',
                  desc: 'Comprehensive ageing buckets distribution (Current, 1-30, 31-60, 61-90, 90+ days, undated dues).',
                  type: 'receivables' as const
                },
                {
                  id: 'exceptions',
                  title: 'Consolidated Exceptions Queue CSV',
                  desc: 'Action center report grouping unallocated payments, settlement mismatches, webhook failures, and pending concessions.',
                  type: 'exceptions' as const
                }
              ].map((exp) => (
                <div key={exp.id} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{exp.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{exp.desc}</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-700/40 pt-4 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Sanitized formula protection enabled</span>
                    <button
                      onClick={() => handleExport(exp.type)}
                      disabled={isExporting}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-medium text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download CSV
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinanceOperations;
