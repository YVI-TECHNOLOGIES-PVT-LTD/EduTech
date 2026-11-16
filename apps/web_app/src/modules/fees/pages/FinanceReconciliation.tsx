import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  X,
  FileText,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Receipt,
  Layers,
  HelpCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Play,
  Calendar,
  CreditCard,
  Building2,
  DollarSign,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

// Liquid Glass design tokens matching EduTrack design system
const GLASS_CARD =
  'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-sm transition-all';
const GLASS_PANEL =
  'bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/60 dark:border-white/5 rounded-2xl';

interface ReconciliationKPIs {
  total_captured_count: number;
  total_captured_amount: number;
  total_internal_success_count: number;
  total_internal_success_amount: number;
  captured_unallocated_count: number;
  captured_unallocated_amount: number;
  pending_verification_count: number;
  pending_verification_amount: number;
  inconsistent_records_count: number;
  inconsistent_records_amount: number;
  duplicate_reference_count: number;
  unresolved_webhook_count: number;
  settlement_records_count: number;
  total_settled_net_amount: number;
  settlement_exceptions_count: number;
  settlement_data_available: boolean;
}

interface ReconciliationTransaction {
  payment_transaction_id: string;
  payment_order_id: string;
  student_id: string;
  student_name: string;
  admission_no: string;
  order_reference: string;
  gateway_order_id: string | null;
  gateway_transaction_id: string | null;
  gateway_name: string | null;
  payment_method: string;
  currency_code: string;
  transaction_amount: number;
  transaction_status: string;
  transaction_date: string | null;
  failure_code: string | null;
  failure_message: string | null;
  gateway_captured: boolean;
  reconciliation_required: boolean;
  total_allocated: number;
  remaining_unallocated: number;
  due_id: string | null;
  due_amount: number | null;
  remaining_due: number | null;
  reconciliation_classification: string;
  settlement_status: string | null;
  webhook_status: string | null;
  created_at: string;
}

export const FinanceReconciliation: React.FC = () => {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'register' | 'exceptions' | 'run' | 'settlements'>('register');

  // KPI Summary State
  const [summary, setSummary] = useState<ReconciliationKPIs | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Transactions Register State
  const [transactions, setTransactions] = useState<ReconciliationTransaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Investigation Drawer State
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [drawerDetail, setDrawerDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Exceptions Queue State
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [totalExceptions, setTotalExceptions] = useState(0);
  const [loadingExceptions, setLoadingExceptions] = useState(false);

  // Run & Preview State
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [executingRun, setExecutingRun] = useState(false);
  const [runNotes, setRunNotes] = useState('');
  const [historicalRuns, setHistoricalRuns] = useState<any[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);

  // Export State
  const [exporting, setExporting] = useState(false);

  // ───────────────────────────────────────────────────────────────────────────
  // Data Fetching Handlers
  // ───────────────────────────────────────────────────────────────────────────

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res: any = await apiClient.get('/fees/reconciliation/summary', { params });
      if (res?.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load reconciliation summary', err);
      toast.error('Failed to load reconciliation summary KPIs');
    } finally {
      setLoadingSummary(false);
    }
  }, [startDate, endDate]);

  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    try {
      const params: any = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (classificationFilter) params.classification = classificationFilter;
      if (methodFilter) params.paymentMethod = methodFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res: any = await apiClient.get('/fees/reconciliation/transactions', { params });
      if (res?.data?.success) {
        setTransactions(res.data.data);
        setTotalCount(res.data.total);
      }
    } catch (err: any) {
      console.error('Failed to load reconciliation transactions', err);
      toast.error('Failed to load reconciliation transaction register');
    } finally {
      setLoadingTransactions(false);
    }
  }, [page, search, statusFilter, classificationFilter, methodFilter, startDate, endDate]);

  const fetchExceptions = useCallback(async () => {
    setLoadingExceptions(true);
    try {
      const res: any = await apiClient.get('/fees/reconciliation/exceptions');
      if (res?.data?.success) {
        setExceptions(res.data.data);
        setTotalExceptions(res.data.total);
      }
    } catch (err: any) {
      console.error('Failed to load exceptions', err);
      toast.error('Failed to load reconciliation exceptions queue');
    } finally {
      setLoadingExceptions(false);
    }
  }, []);

  const fetchRuns = useCallback(async () => {
    setLoadingRuns(true);
    try {
      const res: any = await apiClient.get('/fees/reconciliation/runs');
      if (res?.data?.success) {
        setHistoricalRuns(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load runs', err);
    } finally {
      setLoadingRuns(false);
    }
  }, []);

  const openInvestigationDrawer = async (txId: string) => {
    setSelectedTxId(txId);
    setLoadingDetail(true);
    try {
      const res: any = await apiClient.get(`/fees/reconciliation/transactions/${txId}`);
      if (res?.data?.success) {
        setDrawerDetail(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load transaction details', err);
      toast.error('Failed to load transaction investigation details');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handlePreviewRun = async () => {
    setLoadingPreview(true);
    try {
      const res: any = await apiClient.post('/fees/reconciliation/preview', {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        paymentMethod: methodFilter || undefined,
      });
      if (res?.data?.success) {
        setPreviewData(res.data.data);
        toast.success('Reconciliation simulation preview generated');
      }
    } catch (err: any) {
      console.error('Preview error', err);
      toast.error('Failed to generate reconciliation preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecuteRun = async () => {
    setExecutingRun(true);
    try {
      const res: any = await apiClient.post('/fees/reconciliation/run', {
        periodStart: startDate || undefined,
        periodEnd: endDate || undefined,
        notes: runNotes || 'Manual reconciliation execution from Finance Workspace',
      });
      if (res?.data?.success) {
        toast.success(`Reconciliation run ${res.data.data.run_reference} completed`);
        fetchSummary();
        fetchTransactions();
        fetchExceptions();
        fetchRuns();
        setRunNotes('');
      }
    } catch (err: any) {
      console.error('Run execution error', err);
      toast.error('Failed to execute reconciliation run');
    } finally {
      setExecutingRun(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (classificationFilter) params.append('classification', classificationFilter);
      if (methodFilter) params.append('paymentMethod', methodFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/v1/fees/reconciliation/export?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'x-tenant-id': localStorage.getItem('tenant_org_id') || '',
        },
      });

      if (!response.ok) throw new Error('Export request failed');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `finance_reconciliation_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Sanitized reconciliation CSV exported successfully');
    } catch (err: any) {
      console.error('CSV export failed', err);
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchTransactions();
    fetchExceptions();
    fetchRuns();
  }, [fetchSummary, fetchTransactions, fetchExceptions, fetchRuns]);

  // Total pages
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // ───────────────────────────────────────────────────────────────────────────
  // Helper Renderers
  // ───────────────────────────────────────────────────────────────────────────

  const renderClassificationBadge = (classification: string) => {
    switch (classification) {
      case 'matched_allocated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Matched & Allocated
          </span>
        );
      case 'captured_unallocated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" /> Captured Unallocated
          </span>
        );
      case 'partially_allocated':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Layers className="w-3.5 h-3.5" /> Partially Allocated
          </span>
        );
      case 'duplicate_reference':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
            <AlertCircle className="w-3.5 h-3.5" /> Duplicate Reference
          </span>
        );
      case 'pending_verification':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5" /> Pending Verification
          </span>
        );
      case 'gateway_failure':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <X className="w-3.5 h-3.5" /> Gateway Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
            <HelpCircle className="w-3.5 h-3.5" /> Inconsistent Record
          </span>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
      case 'paid':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            SUCCESS
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            PENDING
          </span>
        );
      case 'initiated':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            INITIATED
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
            FAILED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            {status?.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ─── Top Header Banner ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/20">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Finance Reconciliation & Settlement Control
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Phase 10 — Multi-source verification comparing gateway captures, ledger allocations, dues & settlements
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchSummary();
              fetchTransactions();
              fetchExceptions();
            }}
            disabled={loadingTransactions}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 shadow-sm transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loadingTransactions ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            disabled={exporting || transactions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/25 transition-all"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* ─── SCREEN A: Overview KPI Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gateway Captured */}
        <div
          onClick={() => {
            setClassificationFilter('');
            setStatusFilter('');
            setActiveTab('register');
          }}
          className={`${GLASS_CARD} p-5 cursor-pointer hover:border-indigo-400/60 dark:hover:border-indigo-500/40 transition-all`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gateway Captured</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            ₹{summary ? summary.total_captured_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>{summary ? summary.total_captured_count : 0} Authoritative Captures</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Authoritative</span>
          </div>
        </div>

        {/* Card 2: Captured Unallocated (CRITICAL KPI) */}
        <div
          onClick={() => {
            setClassificationFilter('captured_unallocated');
            setActiveTab('register');
          }}
          className={`${GLASS_CARD} p-5 cursor-pointer border-amber-300 dark:border-amber-700/60 hover:border-amber-500 transition-all`}
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Captured Unallocated</span>
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 animate-bounce">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            ₹{summary ? summary.captured_unallocated_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 flex items-center justify-between">
            <span>{summary ? summary.captured_unallocated_count : 0} Awaiting Ledger Split</span>
            <span className="font-semibold text-amber-700 dark:text-amber-300">Action Required</span>
          </div>
        </div>

        {/* Card 3: Pending Verification */}
        <div
          onClick={() => {
            setStatusFilter('initiated');
            setActiveTab('register');
          }}
          className={`${GLASS_CARD} p-5 cursor-pointer hover:border-indigo-400/60 transition-all`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Verification</span>
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            ₹{summary ? summary.pending_verification_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>{summary ? summary.pending_verification_count : 0} Initiated / Pending</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">In Flight</span>
          </div>
        </div>

        {/* Card 4: Gateway Settlements */}
        <div
          onClick={() => setActiveTab('settlements')}
          className={`${GLASS_CARD} p-5 cursor-pointer hover:border-indigo-400/60 transition-all`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Settled to Bank</span>
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            ₹{summary ? summary.total_settled_net_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>{summary ? summary.settlement_records_count : 0} Batches Confirmed</span>
            <span className={summary?.settlement_data_available ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
              {summary?.settlement_data_available ? 'Available' : 'Historical'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('register')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'register'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Reconciliation Register
        </button>

        <button
          onClick={() => setActiveTab('exceptions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'exceptions'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Exception Queue
          {summary && summary.captured_unallocated_count > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-xs bg-amber-500 text-white font-bold">
              {summary.captured_unallocated_count}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('run')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'run'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Play className="w-4 h-4" />
          Reconciliation Run & Audit
        </button>

        <button
          onClick={() => setActiveTab('settlements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'settlements'
              ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Settlement Control
        </button>
      </div>

      {/* ─── TAB 1: RECONCILIATION REGISTER (SCREEN B) ────────────────── */}
      {activeTab === 'register' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className={`${GLASS_CARD} p-4`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Search input */}
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student, admission, order or pay ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="initiated">Initiated</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Classification Filter */}
              <div>
                <select
                  value={classificationFilter}
                  onChange={(e) => setClassificationFilter(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Classifications</option>
                  <option value="matched_allocated">Matched & Allocated</option>
                  <option value="captured_unallocated">Captured Unallocated</option>
                  <option value="partially_allocated">Partially Allocated</option>
                  <option value="duplicate_reference">Duplicate Reference</option>
                  <option value="pending_verification">Pending Verification</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* End Date */}
              <div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Table Register */}
          <div className={`${GLASS_CARD} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Order / Gateway Ref</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Gateway Capture</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Allocated</th>
                    <th className="py-3 px-4 text-center">Classification</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {loadingTransactions ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                        Loading verified reconciliation records...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        No reconciliation transactions found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr
                        key={tx.payment_transaction_id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">{tx.student_name}</div>
                          <div className="text-xs text-slate-500 font-mono">{tx.admission_no}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400">
                            {tx.order_reference}
                          </div>
                          <div className="font-mono text-[11px] text-slate-400">
                            {tx.gateway_transaction_id || tx.gateway_order_id || 'No Gateway ID'}
                          </div>
                        </td>
                        <td className="py-3 px-4 capitalize font-medium text-slate-600 dark:text-slate-300">
                          {tx.payment_method}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                          ₹{tx.transaction_amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {tx.gateway_captured ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Captured
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Unconfirmed</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">{renderStatusBadge(tx.transaction_status)}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                          ₹{tx.total_allocated.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {renderClassificationBadge(tx.reconciliation_classification)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => openInvestigationDrawer(tx.payment_transaction_id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Inspect Transaction"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} records
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: EXCEPTION MANAGEMENT QUEUE (SCREEN D) ─────────────── */}
      {activeTab === 'exceptions' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-bold text-amber-900 dark:text-amber-200">
                Accounting Exception Management & Triage
              </span>
              <p className="text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                These records represent captured funds that cannot be allocated, duplicate gateway references, or
                mismatched ledger states. Review the suggested accounting actions before allocating funds or contacting
                parents.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {loadingExceptions ? (
              <div className="p-12 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                Scanning exceptions queue...
              </div>
            ) : exceptions.length === 0 ? (
              <div className={`${GLASS_CARD} p-12 text-center text-slate-500`}>
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Zero Open Exceptions</h3>
                <p className="text-sm text-slate-500 mt-1">
                  All processed payment transactions are reconciled with verified ledger allocations.
                </p>
              </div>
            ) : (
              exceptions.map((exc) => (
                <div
                  key={exc.payment_transaction_id}
                  className={`${GLASS_CARD} p-5 hover:border-amber-400/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                        {exc.exception_type}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {exc.student_name} ({exc.admission_no})
                      </span>
                      <span className="text-xs font-mono text-slate-400">• Ref: {exc.order_reference}</span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Recommended Action: {exc.recommended_action}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                      <span>Gateway Pay ID: {exc.gateway_transaction_id || 'N/A'}</span>
                      <span>Created: {new Date(exc.created_at).toLocaleString('en-IN')}</span>
                      <span>Total Allocated: ₹{exc.total_allocated.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-center">
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                        ₹{exc.amount.toFixed(2)}
                      </div>
                      <span className="text-[11px] text-amber-600 font-medium">Unreconciled Funds</span>
                    </div>

                    <button
                      onClick={() => openInvestigationDrawer(exc.payment_transaction_id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all"
                    >
                      Investigate <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: RECONCILIATION RUN & PREVIEW (SCREEN E) ───────────── */}
      {activeTab === 'run' && (
        <div className="space-y-6">
          <div className={`${GLASS_CARD} p-6 space-y-4`}>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Run Reconciliation Simulation</h2>
              <p className="text-sm text-slate-500">
                Execute a read-only preview or durable reconciliation audit run against the physical database.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Period Start</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Period End</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Execution Notes</label>
                <input
                  type="text"
                  placeholder="e.g. End of Month Fee Audit"
                  value={runNotes}
                  onChange={(e) => setRunNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handlePreviewRun}
                disabled={loadingPreview}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-800 dark:text-slate-200 shadow-sm transition-all"
              >
                <Eye className="w-4 h-4" />
                {loadingPreview ? 'Analyzing...' : 'Preview Matching Criteria'}
              </button>

              <button
                onClick={handleExecuteRun}
                disabled={executingRun}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/25 transition-all"
              >
                <Play className="w-4 h-4" />
                {executingRun ? 'Executing Audit...' : 'Execute Durable Reconciliation Run'}
              </button>
            </div>

            {/* Preview Output Display */}
            {previewData && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
                  <span>Simulation Summary Results</span>
                  <span>Examined: {previewData.examined_records_count} Transactions</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-400 block">Matched & Clean</span>
                    <span className="text-base font-bold text-emerald-600">
                      {previewData.summary.matched_count} (₹{previewData.summary.matched_amount})
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-400 block">Captured Unallocated</span>
                    <span className="text-base font-bold text-amber-600">
                      {previewData.summary.captured_unallocated_count} (₹
                      {previewData.summary.captured_unallocated_amount})
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-400 block">Partially Allocated</span>
                    <span className="text-base font-bold text-blue-600">
                      {previewData.summary.partially_allocated_count}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-400 block">Total Exceptions</span>
                    <span className="text-base font-bold text-rose-600">
                      {previewData.summary.total_exceptions_count} (₹
                      {previewData.summary.total_exceptions_amount})
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Matching Invariants Applied:</span>
                  <ul className="list-disc list-inside">
                    {previewData.matching_criteria.map((c: string, idx: number) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Historical Runs List */}
          <div className={`${GLASS_CARD} p-6 space-y-3`}>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Historical Reconciliation Runs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">Run Reference</th>
                    <th className="py-2.5 px-3">Started At</th>
                    <th className="py-2.5 px-3">Completed At</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {historicalRuns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No previous reconciliation runs recorded.
                      </td>
                    </tr>
                  ) : (
                    historicalRuns.map((r) => (
                      <tr key={r.payment_reconciliation_run_id}>
                        <td className="py-2.5 px-3 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                          {r.run_reference}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {r.started_at ? new Date(r.started_at).toLocaleString('en-IN') : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {r.completed_at ? new Date(r.completed_at).toLocaleString('en-IN') : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              r.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{r.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: SETTLEMENT CONTROL ────────────────────────────────── */}
      {activeTab === 'settlements' && (
        <div className={`${GLASS_CARD} p-6 space-y-4`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Gateway Settlement Control</h2>
              <p className="text-sm text-slate-500">
                Track gross payments, provider fees, GST deductions, and net disbursements deposited into school bank
                accounts.
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                summary?.settlement_data_available
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {summary?.settlement_data_available ? 'Settlement Sync Active' : 'Historical Table Mode'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-500 uppercase block">Settled Batches</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {summary?.settlement_records_count || 0}
              </div>
              <span className="text-xs text-slate-400">Total settlement events</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-500 uppercase block">Net Bank Credit</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                ₹{summary?.total_settled_net_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
              </div>
              <span className="text-xs text-slate-400">After gateway fee & GST deductions</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-500 uppercase block">Settlement Discrepancies</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">{summary?.settlement_exceptions_count || 0}</div>
              <span className="text-xs text-slate-400">Unmatched settlement items</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-purple-600" />
              Settlement Reconciliation Principles:
            </div>
            <p>
              1. <strong>Gross vs Net</strong>: Razorpay gross payment collections are debited by payment gateway MDR
              fees and GST prior to batch settlement payout.
            </p>
            <p>
              2. <strong>Settlement Cycle</strong>: Transactions captured today settle per Razorpay's institutional
              T+1 or T+2 settlement schedule.
            </p>
            <p>
              3. <strong>Discrepancy Reporting</strong>: Any difference between gross collected paise and net credited
              rupees is reconciled against `gateway_settlement_items`.
            </p>
          </div>
        </div>
      )}

      {/* ─── SCREEN C: TRANSACTION INVESTIGATION DRAWER ───────────────── */}
      {selectedTxId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 overflow-y-auto p-6 space-y-6 flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Transaction Investigation</h3>
                <p className="text-xs font-mono text-slate-400">ID: {selectedTxId}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedTxId(null);
                  setDrawerDetail(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                Retrieving multi-source transaction evidence...
              </div>
            ) : !drawerDetail ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                Transaction detail not found or unauthorized.
              </div>
            ) : (
              <div className="space-y-6 flex-1 text-sm">
                {/* Discrepancy Alert Banner if Captured Unallocated */}
                {drawerDetail.calculations?.is_captured_unallocated && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Captured Payment Pending Ledger Allocation
                    </div>
                    <p className="text-xs text-amber-800/90 dark:text-amber-300/90">
                      {drawerDetail.transaction.failure_message ||
                        'Payment was successfully captured by Razorpay, but cannot be allocated because the fee due was already settled or amount exceeds remaining balance.'}
                    </p>
                    <div className="text-xs text-amber-700 font-mono">
                      Failure Code: {drawerDetail.transaction.failure_code} • Gateway Pay ID:{' '}
                      {drawerDetail.transaction.gateway_transaction_id}
                    </div>
                  </div>
                )}

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-400 font-medium block">Payment Amount</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                      ₹{drawerDetail.transaction.amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-400 font-medium block">Total Allocated</span>
                    <span className="text-base font-bold text-emerald-600 font-mono">
                      ₹{drawerDetail.calculations.total_allocated.toFixed(2)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-400 font-medium block">Unallocated Funds</span>
                    <span className="text-base font-bold text-amber-600 font-mono">
                      ₹{drawerDetail.calculations.remaining_unallocated.toFixed(2)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] text-slate-400 font-medium block">Remaining Due</span>
                    <span className="text-base font-bold text-slate-700 dark:text-slate-300 font-mono">
                      ₹{(drawerDetail.due?.remaining_due ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Student & Order Reference */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Order & Student Scope</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Student: </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {drawerDetail.student.student_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Admission No: </span>
                      <span className="font-mono font-medium">{drawerDetail.student.admission_no}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Order Ref: </span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">
                        {drawerDetail.order.order_reference}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Method: </span>
                      <span className="capitalize font-medium">{drawerDetail.transaction.payment_method}</span>
                    </div>
                  </div>
                </div>

                {/* Gateway Evidence */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Gateway Capture Evidence
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 font-sans">Gateway Provider: </span>
                      {drawerDetail.transaction.gateway_name || 'razorpay'}
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans">Gateway Pay ID: </span>
                      {drawerDetail.transaction.gateway_transaction_id || 'N/A'}
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans">Gateway Order ID: </span>
                      {drawerDetail.transaction.gateway_order_id || 'N/A'}
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans">Captured Status: </span>
                      <span
                        className={
                          drawerDetail.transaction.status === 'success' ||
                          drawerDetail.transaction.gateway_response?.gateway_captured
                            ? 'text-emerald-600 font-bold'
                            : 'text-amber-600 font-bold'
                        }
                      >
                        {drawerDetail.transaction.status === 'success' ||
                        drawerDetail.transaction.gateway_response?.gateway_captured
                          ? 'YES (CAPTURED)'
                          : 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Allocations Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Allocations ({drawerDetail.allocations.length})
                  </h4>
                  {drawerDetail.allocations.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                      Zero ledger allocations committed for this transaction.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                      {drawerDetail.allocations.map((a: any) => (
                        <div key={a.payment_allocation_id} className="p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {a.charge_description}
                            </span>
                            <span className="text-slate-400 font-mono block">
                              Allocated: {new Date(a.allocated_at).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-emerald-600">₹{a.allocated_amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Webhook Events Trail */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Related Webhook Events ({drawerDetail.webhooks.length})
                  </h4>
                  {drawerDetail.webhooks.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                      No webhook callbacks recorded.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                      {drawerDetail.webhooks.map((w: any) => (
                        <div key={w.payment_webhook_event_id} className="p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                              {w.event_type}
                            </span>
                            <span className="text-slate-400 font-mono block">ID: {w.provider_event_id}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              w.status === 'processed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {w.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceReconciliation;
