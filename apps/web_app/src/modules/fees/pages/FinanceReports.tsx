import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart2,
  TrendingUp,
  AlertCircle,
  Clock,
  Download,
  Filter,
  Search,
  RefreshCw,
  Coins,
  Receipt,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  ShieldCheck,
  Percent,
  Landmark,
  Scale,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Building2,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import { apiClient } from '../../../lib/api-client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================
interface SummaryData {
  currency: string;
  report_period: {
    start_date: string | null;
    end_date: string | null;
  };
  assessed_charges_total: number;
  assessed_charges_count: number;
  successful_collections_total: number;
  successful_collections_count: number;
  outstanding_receivables_total: number;
  overdue_receivables_total: number;
  overdue_receivables_count: number;
  approved_concessions_total: number;
  approved_concessions_count: number;
  captured_unallocated_total: number;
  captured_unallocated_count: number;
  gross_gateway_collections: number;
  net_settled_deposits: number;
  reconciliation_exceptions_count: number;
  ageing_distribution: {
    current: number;
    overdue_1_7: number;
    overdue_8_30: number;
    overdue_31_60: number;
    overdue_61_90: number;
    overdue_90_plus: number;
  };
  data_availability: {
    general_ledger_posted_trial_balance: string;
    gateway_settlement_feed: string;
  };
}

interface CollectionItem {
  payment_transaction_id: string;
  payment_order_id: string;
  student_id: string;
  student_name: string;
  admission_no: string;
  payment_method: string;
  status: string;
  amount: number;
  currency_code: string;
  gateway_transaction_id: string | null;
  transaction_date: string;
  allocated_amount: number;
  is_unallocated: boolean;
}

interface AgeingBucketInfo {
  count: number;
  total_outstanding: number;
  total_assessed: number;
  total_paid: number;
}

interface DueDetailItem {
  student_charge_due_id: string;
  student_charge_id: string;
  student_id: string;
  student_name: string;
  admission_no: string;
  due_date: string;
  amount_due: number;
  allocated_amount: number;
  outstanding_amount: number;
  days_overdue: number;
  ageing_bucket: string;
  status: string;
}

interface ComponentItem {
  component_id: string;
  component_name: string;
  component_code: string;
  charges_count: number;
  student_count: number;
  assessed_amount: number;
  total_dues_amount: number;
  total_paid_amount: number;
  total_outstanding_amount: number;
  collection_rate_pct: number;
}

interface ConcessionSummary {
  total_records: number;
  approved_or_applied_count: number;
  pending_approval_count: number;
  rejected_count: number;
}

interface ConcessionTypeItem {
  scholarship_type: string;
  status: string;
  count: number;
  student_count: number;
  avg_percentage: number;
  min_percentage: number;
  max_percentage: number;
}

interface SettlementItem {
  gateway_settlement_id: string;
  settlement_reference: string;
  settlement_date: string;
  status: string;
  gross_amount: number;
  fee_amount: number;
  tax_amount: number;
  other_adjustment_amount: number;
  net_settlement_amount: number;
  currency: string;
  utr: string | null;
  total_items_count: number;
  reconciled_items_count: number;
}

export const FinanceReports: React.FC = () => {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<
    'overview' | 'collections' | 'receivables' | 'assessments' | 'concessions' | 'settlements' | 'reconciliation' | 'readiness' | 'exports'
  >('overview');

  // Global filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);
  const [loading, setLoading] = useState<boolean>(true);

  // Tab specific data states
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [collections, setCollections] = useState<{ total: number; data: CollectionItem[]; trends: any[] } | null>(null);
  const [ageing, setAgeing] = useState<{
    buckets: Record<string, AgeingBucketInfo>;
    total_outstanding: number;
    total_overdue: number;
    detail: { total: number; data: DueDetailItem[] };
  } | null>(null);
  const [selectedAgeingBucket, setSelectedAgeingBucket] = useState<string>('all');
  const [assessments, setAssessments] = useState<{ components: ComponentItem[]; summary: any } | null>(null);
  const [concessions, setConcessions] = useState<{ summary: ConcessionSummary; concessions_by_type: ConcessionTypeItem[] } | null>(null);
  const [settlements, setSettlements] = useState<{ is_available: boolean; total: number; data: SettlementItem[]; summary: any } | null>(null);
  const [reconciliation, setReconciliation] = useState<any | null>(null);
  const [readiness, setReadiness] = useState<any | null>(null);

  // Drill-down drawer
  const [drawerRecord, setDrawerRecord] = useState<any | null>(null);

  // Format currency
  const formatMoney = (val: number | undefined | null) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Quick period helpers
  const handleQuickPeriod = (period: 'this_month' | 'last_month' | 'ytd' | 'all') => {
    const now = new Date();
    if (period === 'this_month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(first);
      setEndDate(last);
    } else if (period === 'last_month') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const last = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      setStartDate(first);
      setEndDate(last);
    } else if (period === 'ytd') {
      const first = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      const last = now.toISOString().split('T')[0];
      setStartDate(first);
      setEndDate(last);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  // Fetch Summary
  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const res = await apiClient.get(`/fees/reports/summary?${params.toString()}`);
      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err: any) {
      console.error('Summary fetch error:', err);
    }
  };

  // Fetch Collections
  const fetchCollections = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (searchTerm) params.set('search', searchTerm);
      params.set('page', String(page));
      params.set('limit', String(limit));
      const res = await apiClient.get(`/fees/reports/collections?${params.toString()}`);
      if (res.data?.success) {
        setCollections(res.data.data);
      }
    } catch (err: any) {
      console.error('Collections fetch error:', err);
    }
  };

  // Fetch Ageing & Receivables
  const fetchAgeing = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedAgeingBucket !== 'all') params.set('ageingBucket', selectedAgeingBucket);
      if (searchTerm) params.set('search', searchTerm);
      params.set('page', String(page));
      params.set('limit', String(limit));
      const res = await apiClient.get(`/fees/reports/ageing?${params.toString()}`);
      if (res.data?.success) {
        setAgeing(res.data.data);
      }
    } catch (err: any) {
      console.error('Ageing fetch error:', err);
    }
  };

  // Fetch Fee Assessments
  const fetchAssessments = async () => {
    try {
      const res = await apiClient.get(`/fees/reports/assessments`);
      if (res.data?.success) {
        setAssessments(res.data.data);
      }
    } catch (err: any) {
      console.error('Assessments fetch error:', err);
    }
  };

  // Fetch Scholarships & Concessions
  const fetchConcessions = async () => {
    try {
      const res = await apiClient.get(`/fees/reports/concessions`);
      if (res.data?.success) {
        setConcessions(res.data.data);
      }
    } catch (err: any) {
      console.error('Concessions fetch error:', err);
    }
  };

  // Fetch Gateway Settlements
  const fetchSettlements = async () => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      const res = await apiClient.get(`/fees/reports/settlements?${params.toString()}`);
      if (res.data?.success) {
        setSettlements(res.data.data);
      }
    } catch (err: any) {
      console.error('Settlements fetch error:', err);
    }
  };

  // Fetch Reconciliation Exceptions
  const fetchReconciliation = async () => {
    try {
      const res = await apiClient.get(`/fees/reports/reconciliation`);
      if (res.data?.success) {
        setReconciliation(res.data.data);
      }
    } catch (err: any) {
      console.error('Reconciliation report error:', err);
    }
  };

  // Fetch Accounting Readiness
  const fetchReadiness = async () => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      const res = await apiClient.get(`/fees/reports/accounting-readiness?${params.toString()}`);
      if (res.data?.success) {
        setReadiness(res.data.data);
      }
    } catch (err: any) {
      console.error('Accounting readiness report error:', err);
    }
  };

  // Coordinated loader
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        await fetchSummary();
      } else if (activeTab === 'collections') {
        await fetchCollections();
      } else if (activeTab === 'receivables') {
        await fetchAgeing();
      } else if (activeTab === 'assessments') {
        await fetchAssessments();
      } else if (activeTab === 'concessions') {
        await fetchConcessions();
      } else if (activeTab === 'settlements') {
        await fetchSettlements();
      } else if (activeTab === 'reconciliation') {
        await fetchReconciliation();
      } else if (activeTab === 'readiness') {
        await fetchReadiness();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadData();
  }, [activeTab, startDate, endDate, selectedAgeingBucket]);

  useEffect(() => {
    if (activeTab === 'collections' || activeTab === 'receivables') {
      loadData();
    }
  }, [page]);

  // Server-side CSV Export Trigger with formula injection protection
  const triggerExport = (reportType: string) => {
    try {
      const params = new URLSearchParams();
      params.set('reportType', reportType);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('token');
      // Direct browser download
      window.open(`/api/fees/reports/export?${params.toString()}&token=${token || ''}`, '_blank');
      toast.success(`Exporting ${reportType.toUpperCase()} CSV report...`);
    } catch (e: any) {
      toast.error('Failed to trigger report export');
    }
  };

  // Chart data for Overview
  const ageingChartData = useMemo(() => {
    if (!summary?.ageing_distribution) return [];
    return [
      { name: 'Current', amount: summary.ageing_distribution.current, fill: '#10b981' },
      { name: '1–7d', amount: summary.ageing_distribution.overdue_1_7, fill: '#3b82f6' },
      { name: '8–30d', amount: summary.ageing_distribution.overdue_8_30, fill: '#eab308' },
      { name: '31–60d', amount: summary.ageing_distribution.overdue_31_60, fill: '#f97316' },
      { name: '61–90d', amount: summary.ageing_distribution.overdue_61_90, fill: '#ef4444' },
      { name: '90+d', amount: summary.ageing_distribution.overdue_90_plus, fill: '#b91c1c' }
    ];
  }, [summary]);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto min-h-screen text-slate-800 dark:text-slate-100">
      {/* ── HEADER & WORKSPACE CONTEXT ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Stage 4 Finance
            </span>
            <span className="text-xs text-slate-500 font-medium tracking-wide uppercase">
              Phase 12: Financial Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Finance Reports & Financial Intelligence
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Authoritative, decimal-safe operational metrics derived strictly from PostgreSQL transaction tables.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleQuickPeriod('this_month')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            This Month
          </button>
          <button
            onClick={() => handleQuickPeriod('last_month')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Last Month
          </button>
          <button
            onClick={() => handleQuickPeriod('ytd')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            YTD
          </button>
          <button
            onClick={() => handleQuickPeriod('all')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            All Dates
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── DATE FILTER BAR ───────────────────────────────────────────────── */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            />
            <span className="text-slate-400 font-medium">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-rose-500 hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear dates
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Tenant Context Verified (Zero Client-Side Impersonation)</span>
        </div>
      </div>

      {/* ── NAVIGATION TABS ───────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2 text-xs font-semibold scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'collections', label: 'Collections Register', icon: Coins },
          { id: 'receivables', label: 'Receivables & Ageing', icon: Clock },
          { id: 'assessments', label: 'Fee Assessments', icon: Receipt },
          { id: 'concessions', label: 'Scholarships & Concessions', icon: Percent },
          { id: 'settlements', label: 'Gateway & Bank Settlements', icon: Landmark },
          { id: 'reconciliation', label: 'Reconciliation Exceptions', icon: AlertCircle },
          { id: 'readiness', label: 'Accounting Readiness', icon: Scale },
          { id: 'exports', label: 'Export Center', icon: Download }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SCREEN A: OVERVIEW & EXECUTIVE KPIS                                    */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* 1. Assessed Charges */}
            <div
              onClick={() => setActiveTab('assessments')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm hover:border-emerald-400 cursor-pointer transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Total Assessed Charges</span>
                <Receipt className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {formatMoney(summary?.assessed_charges_total)}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>{summary?.assessed_charges_count || 0} student charges</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium group-hover:underline flex items-center">
                  Breakdown <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>

            {/* 2. Successful Collections */}
            <div
              onClick={() => setActiveTab('collections')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm hover:border-emerald-400 cursor-pointer transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Successful Collections</span>
                <Coins className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatMoney(summary?.successful_collections_total)}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>{summary?.successful_collections_count || 0} transactions</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium group-hover:underline flex items-center">
                  Register <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>

            {/* 3. Outstanding Receivables */}
            <div
              onClick={() => setActiveTab('receivables')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm hover:border-emerald-400 cursor-pointer transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Outstanding Receivables</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {formatMoney(summary?.outstanding_receivables_total)}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>Net dues remaining</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium group-hover:underline flex items-center">
                  Ageing <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>

            {/* 4. Overdue Receivables */}
            <div
              onClick={() => setActiveTab('receivables')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm hover:border-rose-400 cursor-pointer transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Overdue Receivables</span>
                <AlertCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
                {formatMoney(summary?.overdue_receivables_total)}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>{summary?.overdue_receivables_count || 0} past due date</span>
                <span className="text-rose-600 dark:text-rose-400 font-medium group-hover:underline flex items-center">
                  Review <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>

            {/* 5. Approved Concessions */}
            <div
              onClick={() => setActiveTab('concessions')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm hover:border-purple-400 cursor-pointer transition-all relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Approved Concessions</span>
                <Percent className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {summary?.approved_concessions_count || 0}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>Concessions granted</span>
                <span className="text-purple-600 dark:text-purple-400 font-medium group-hover:underline flex items-center">
                  Details <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>

            {/* 6. Captured-but-Unallocated */}
            <div
              onClick={() => setActiveTab('collections')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm hover:border-orange-400 cursor-pointer transition-all relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Captured Unallocated</span>
                <Building2 className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {formatMoney(summary?.captured_unallocated_total)}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>{summary?.captured_unallocated_count || 0} unlinked txns</span>
                <span className="text-orange-600 dark:text-orange-400 font-medium group-hover:underline flex items-center">
                  Segregated <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>

            {/* 7. Gross Gateway Collections */}
            <div
              onClick={() => setActiveTab('settlements')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm hover:border-indigo-400 cursor-pointer transition-all relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Gross Gateway Vol.</span>
                <Landmark className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatMoney(summary?.gross_gateway_collections)}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>Razorpay gross captured</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium group-hover:underline flex items-center">
                  Settlements <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>

            {/* 8. Net Settled Deposits */}
            <div
              onClick={() => setActiveTab('settlements')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm hover:border-teal-400 cursor-pointer transition-all relative overflow-hidden group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">Net Settled Deposits</span>
                <CheckCircle2 className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-xl font-bold text-teal-600 dark:text-teal-400">
                {formatMoney(summary?.net_settled_deposits)}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                <span>Bank-deposited funds</span>
                <span className="text-teal-600 dark:text-teal-400 font-medium group-hover:underline flex items-center">
                  Reconcile <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Visual Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ageing Buckets Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Receivables Ageing Distribution
                  </h3>
                  <p className="text-xs text-slate-500">Dues partitioned by Phase 8 ageing buckets</p>
                </div>
                <button
                  onClick={() => setActiveTab('receivables')}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  View Details &rarr;
                </button>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageingChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(val: any) => [formatMoney(val), 'Outstanding']}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Audit & Constraints Disclosure */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                  <Scale className="w-5 h-5" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Operational Integrity & Data Authority
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                  Financial calculations in this workspace adhere strictly to PostgreSQL physical tables. Operational summaries are segregated from posted general-ledger balances.
                </p>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Database Schema Freeze:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Strictly Enforced (Zero DDL)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <span className="font-medium text-slate-600 dark:text-slate-400">Captured-but-Unallocated Funds:</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-400">Segregated from Revenue</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <span className="font-medium text-slate-600 dark:text-slate-400">General Ledger Trial Balance:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">Blocked (No Fabricated Balances)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                    <span className="font-medium text-slate-600 dark:text-slate-400">CSV Export Sanitization:</span>
                    <span className="font-semibold text-teal-600 dark:text-teal-400">Active (Formula Shield)</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500">Need formal double-entry preview?</span>
                <a
                  href="/app/finance/accounting"
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  Accounting Workspace <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SCREEN B: COLLECTIONS REPORT & REGISTER                                 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'collections' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name, admission no, or txn ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCollections()}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerExport('collections')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Collections Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Txn Reference</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Allocation</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {collections?.data && collections.data.length > 0 ? (
                    collections.data.map((row) => (
                      <tr
                        key={row.payment_transaction_id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                        onClick={() => setDrawerRecord(row)}
                      >
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {row.payment_transaction_id.slice(0, 8)}...
                          {row.gateway_transaction_id && (
                            <span className="block text-[10px] text-slate-400 font-sans">
                              GW: {row.gateway_transaction_id.slice(0, 12)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {row.student_name || 'Unassigned'}
                          </div>
                          <div className="text-[11px] text-slate-400">{row.admission_no || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3 capitalize text-slate-700 dark:text-slate-300">
                          {row.payment_method.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              row.status === 'success'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : row.status === 'pending'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {formatMoney(row.amount)}
                        </td>
                        <td className="px-4 py-3">
                          {row.is_unallocated ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300">
                              Unallocated
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                              Allocated ({formatMoney(row.allocated_amount)})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {new Date(row.transaction_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                        No transactions found for the specified period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>
                Total records: <strong className="text-slate-900 dark:text-white">{collections?.total || 0}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>Page {page}</span>
                <button
                  disabled={!collections?.total || page * limit >= collections.total}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SCREEN C: RECEIVABLES & AGEING REPORT                                  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'receivables' && (
        <div className="space-y-5">
          {/* Ageing Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { id: 'all', label: 'All Dues', bucket: null },
              { id: 'CURRENT', label: 'Current (Not Due)', bucket: ageing?.buckets?.CURRENT },
              { id: 'OVERDUE_1_7', label: '1–7 Days Overdue', bucket: ageing?.buckets?.OVERDUE_1_7 },
              { id: 'OVERDUE_8_30', label: '8–30 Days Overdue', bucket: ageing?.buckets?.OVERDUE_8_30 },
              { id: 'OVERDUE_31_60', label: '31–60 Days Overdue', bucket: ageing?.buckets?.OVERDUE_31_60 },
              { id: 'OVERDUE_90_PLUS', label: '90+ Days Overdue', bucket: ageing?.buckets?.OVERDUE_90_PLUS }
            ].map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedAgeingBucket(b.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedAgeingBucket === b.id
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-semibold text-slate-500 truncate">{b.label}</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {b.id === 'all'
                    ? formatMoney(ageing?.total_outstanding)
                    : formatMoney(b.bucket?.total_outstanding)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {b.id === 'all'
                    ? `${ageing?.detail?.total || 0} obligations`
                    : `${b.bucket?.count || 0} obligations`}
                </div>
              </div>
            ))}
          </div>

          {/* Dues Register Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Outstanding Dues Register</h3>
                <p className="text-xs text-slate-500">Student obligations calculated with decimal-safe remaining balance.</p>
              </div>
              <button
                onClick={() => triggerExport('receivables')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Export Receivables CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Ageing Bucket</th>
                    <th className="px-4 py-3">Scheduled Due</th>
                    <th className="px-4 py-3">Allocated Paid</th>
                    <th className="px-4 py-3">Outstanding Remaining</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {ageing?.detail?.data && ageing.detail.data.length > 0 ? (
                    ageing.detail.data.map((row) => (
                      <tr
                        key={row.student_charge_due_id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                        onClick={() => setDrawerRecord(row)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{row.student_name}</div>
                          <div className="text-[11px] text-slate-400">{row.admission_no}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {new Date(row.due_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              row.ageing_bucket === 'CURRENT'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : row.ageing_bucket.includes('1_7')
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                : row.ageing_bucket.includes('8_30')
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {row.ageing_bucket}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatMoney(row.amount_due)}</td>
                        <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">
                          {formatMoney(row.allocated_amount)}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {formatMoney(row.outstanding_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                        No outstanding obligations match the selected ageing bucket.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>
                Total obligations: <strong className="text-slate-900 dark:text-white">{ageing?.detail?.total || 0}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>Page {page}</span>
                <button
                  disabled={!ageing?.detail?.total || page * limit >= ageing.detail.total}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SCREEN D: FEE ASSESSMENTS & COMPONENT REPORT                          */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'assessments' && (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500">Total Assessed Volume</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {formatMoney(assessments?.summary?.total_assessed)}
              </div>
              <div className="text-xs text-slate-400 mt-1">{assessments?.summary?.total_charges_count || 0} charge records</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500">Scheduled Fee Dues</span>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {formatMoney(assessments?.summary?.total_dues)}
              </div>
              <div className="text-xs text-slate-400 mt-1">Post-concession net demand</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500">Realized Collections</span>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatMoney(assessments?.summary?.total_paid)}
              </div>
              <div className="text-xs text-emerald-500 mt-1">
                {assessments?.summary?.collection_rate_pct || 0}% collection rate
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500">Uncollected Balance</span>
              <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {formatMoney(assessments?.summary?.total_outstanding)}
              </div>
              <div className="text-xs text-slate-400 mt-1">Remaining to collect</div>
            </div>
          </div>

          {/* Component Breakdown Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Fee Component Performance</h3>
                <p className="text-xs text-slate-500">Independent CTE aggregations to eliminate Cartesian 1:N join inflation.</p>
              </div>
              <button
                onClick={() => triggerExport('assessments')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Export Components CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Fee Component</th>
                    <th className="px-4 py-3">Enrolled Students</th>
                    <th className="px-4 py-3">Assessed Total</th>
                    <th className="px-4 py-3">Net Scheduled Dues</th>
                    <th className="px-4 py-3">Realized Paid</th>
                    <th className="px-4 py-3">Outstanding</th>
                    <th className="px-4 py-3">Collection %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {assessments?.components && assessments.components.length > 0 ? (
                    assessments.components.map((comp) => (
                      <tr key={comp.component_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">{comp.component_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{comp.component_code}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{comp.student_count} students</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatMoney(comp.assessed_amount)}</td>
                        <td className="px-4 py-3 text-blue-600 dark:text-blue-400">{formatMoney(comp.total_dues_amount)}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatMoney(comp.total_paid_amount)}
                        </td>
                        <td className="px-4 py-3 text-rose-600 dark:text-rose-400 font-semibold">
                          {formatMoney(comp.total_outstanding_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${Math.min(100, comp.collection_rate_pct)}%` }}
                              />
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {comp.collection_rate_pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                        No fee components assigned or assessed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SCREEN E: SCHOLARSHIPS & CONCESSIONS REPORT                            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'concessions' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500">Total Concession Records</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {concessions?.summary?.total_records || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">Scholarships & fee concessions</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500">Approved or Applied</span>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {concessions?.summary?.approved_or_applied_count || 0}
              </div>
              <div className="text-xs text-emerald-500 mt-1">Active student waivers</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500">Pending Review</span>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {concessions?.summary?.pending_approval_count || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">Awaiting governance review</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Scholarship Distribution by Category</h3>
                <p className="text-xs text-slate-500">
                  Approved concessions vs applied ledger deductions (concessions only reduce due amount once applied).
                </p>
              </div>
              <button
                onClick={() => triggerExport('concessions')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Export Concessions CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Scholarship Category</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Records Count</th>
                    <th className="px-4 py-3">Impacted Students</th>
                    <th className="px-4 py-3">Average Discount %</th>
                    <th className="px-4 py-3">Discount Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {concessions?.concessions_by_type && concessions.concessions_by_type.length > 0 ? (
                    concessions.concessions_by_type.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white capitalize">
                          {row.scholarship_type.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              row.status === 'approved' || row.status === 'applied'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : row.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.count}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.student_count}</td>
                        <td className="px-4 py-3 font-bold text-purple-600 dark:text-purple-400">
                          {row.avg_percentage}%
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {row.min_percentage}% – {row.max_percentage}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs">
                        No scholarship or concession records recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SCREEN F: GATEWAY & BANK SETTLEMENTS                                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'settlements' && (
        <div className="space-y-5">
          {settlements?.is_available === false && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-4 rounded-xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <div>
                <strong className="block font-semibold mb-0.5">Authoritative Settlement Records Unavailable</strong>
                No processed bank settlements have been posted yet for this organization. When automated Razorpay webhooks or manual bank settlement batches are ingested, net deposit calculations will appear here.
              </div>
            </div>
          )}

          {/* Mathematical balancing verification card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Settlement Arithmetic Balancing Formula
            </h4>
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg">
              <span className="text-slate-900 dark:text-white font-bold">Gross Captured</span>
              <span className="text-slate-400">=</span>
              <span className="text-teal-600 dark:text-teal-400 font-bold">Net Bank Deposit</span>
              <span className="text-slate-400">+</span>
              <span className="text-rose-500 font-semibold">Gateway Fees</span>
              <span className="text-slate-400">+</span>
              <span className="text-rose-400 font-semibold">GST Taxes</span>
              <span className="text-slate-400">±</span>
              <span className="text-blue-500">Other Adjustments</span>
            </div>
          </div>

          {/* Settlements Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Settlement Batch Register</h3>
                <p className="text-xs text-slate-500">Deduction-verified bank payouts with UTR references.</p>
              </div>
              <button
                onClick={() => triggerExport('settlements')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Export Settlements CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Reference / UTR</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Gross Amount</th>
                    <th className="px-4 py-3">Fees & Tax</th>
                    <th className="px-4 py-3">Net Deposited</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {settlements?.data && settlements.data.length > 0 ? (
                    settlements.data.map((row) => (
                      <tr key={row.gateway_settlement_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono text-[11px]">
                          <div className="font-semibold text-slate-900 dark:text-white">{row.settlement_reference}</div>
                          {row.utr && <div className="text-[10px] text-slate-400">UTR: {row.utr}</div>}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {new Date(row.settlement_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-semibold">
                          {formatMoney(row.gross_amount)}
                        </td>
                        <td className="px-4 py-3 text-rose-600 dark:text-rose-400">
                          {formatMoney(row.fee_amount + row.tax_amount)}
                        </td>
                        <td className="px-4 py-3 font-bold text-teal-600 dark:text-teal-400">
                          {formatMoney(row.net_settlement_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {row.reconciled_items_count} / {row.total_items_count}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                        No gateway settlement records exist for the current tenant.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SCREEN G: RECONCILIATION EXCEPTIONS REPORT                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Operational Reconciliation Exceptions
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Exceptions identified by Phase 10 reconciliation engine requiring operational attention.
              </p>
            </div>
            <a
              href="/app/finance/reconciliation"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              Open Reconciliation Workspace <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500">Total Unresolved Exceptions</span>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                {reconciliation?.unresolved_exceptions_count || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">Requiring finance triage</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500">Captured-but-Unallocated</span>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {reconciliation?.captured_unallocated_count || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">Collected but unlinked to fee due</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500">Reconciliation Health</span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {reconciliation?.unresolved_exceptions_count === 0 ? '100%' : 'Audit Req'}
              </div>
              <div className="text-xs text-slate-400 mt-1">Dual-source validation active</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SCREEN H: ACCOUNTING READINESS REPORT                                  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'readiness' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Scale className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Operational Accounting Readiness
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Pre-classified operational transactions mapped to debit/credit system accounts without fabricating posted ledger balances.
              </p>
            </div>
            <a
              href="/app/finance/accounting"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              Open Accounting Workspace <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Operational Records Awaiting GL Posting
              </h4>
              <button
                onClick={() => triggerExport('accounting-readiness')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Export Readiness CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Source Ref</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Accounting Status</th>
                    <th className="px-4 py-3">Debit Account</th>
                    <th className="px-4 py-3">Credit Account</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {readiness?.data && readiness.data.length > 0 ? (
                    readiness.data.map((row: any) => (
                      <tr key={row.record_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {row.source_reference?.slice(0, 10)}...
                        </td>
                        <td className="px-4 py-3 capitalize text-slate-700 dark:text-slate-300">
                          {row.source_type}
                        </td>
                        <td className="px-4 py-3">{row.student_name || 'N/A'}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {formatMoney(row.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              row.accounting_readiness_status === 'READY_FOR_GL'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {row.accounting_readiness_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          {row.suggested_debit_account}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          {row.suggested_credit_account}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                        No records awaiting accounting classification.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SCREEN I: EXPORT CENTER                                                */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'exports' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Financial Export Center</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Generate server-side CSV exports for audited financial registers. All exported data applies server-side authenticated tenant boundaries and incorporates spreadsheet formula injection protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                id: 'collections',
                title: 'Collections Register',
                desc: 'Payment transactions, methods, gateway references, and allocation status.',
                icon: Coins
              },
              {
                id: 'receivables',
                title: 'Receivables & Ageing Register',
                desc: 'Student dues with overdue days, ageing buckets, and remaining amounts.',
                icon: Clock
              },
              {
                id: 'assessments',
                title: 'Fee Component Summary',
                desc: 'Component-wise assessed volume, scheduled dues, realized paid, and collection rate.',
                icon: Receipt
              },
              {
                id: 'concessions',
                title: 'Scholarships & Concessions',
                desc: 'Approved vs applied waivers by scholarship type with percentage statistics.',
                icon: Percent
              },
              {
                id: 'settlements',
                title: 'Gateway Settlements',
                desc: 'Payout batches with gross collections, deductions, and net bank deposits.',
                icon: Landmark
              },
              {
                id: 'accounting-readiness',
                title: 'Accounting Readiness Register',
                desc: 'Operational financial records mapped to standard chart of accounts debit/credits.',
                icon: Scale
              }
            ].map((exp) => {
              const Icon = exp.icon;
              return (
                <div
                  key={exp.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex flex-col justify-between hover:border-emerald-400 transition-all"
                >
                  <div>
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">{exp.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">{exp.desc}</p>
                  </div>
                  <button
                    onClick={() => triggerExport(exp.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-emerald-600 text-slate-800 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DRILL DOWN INSPECTOR DRAWER ───────────────────────────────────── */}
      {drawerRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  Financial Record Inspector
                </h3>
                <button
                  onClick={() => setDrawerRecord(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {Object.entries(drawerRecord).map(([key, value]) => {
                  if (typeof value === 'object' && value !== null) return null;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800"
                    >
                      <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="font-mono text-slate-900 dark:text-slate-100 text-right max-w-[200px] truncate">
                        {String(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setDrawerRecord(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceReports;
