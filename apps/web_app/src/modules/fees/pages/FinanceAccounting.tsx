import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Search,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  FileSpreadsheet,
  Info,
  Scale,
  Coins,
  Receipt,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

interface AccountingSummary {
  transactions_awaiting_accounting_count: number;
  transactions_awaiting_accounting_amount: number;
  unposted_fee_assessments_count: number;
  unposted_fee_assessments_amount: number;
  unposted_payments_count: number;
  unposted_payments_amount: number;
  unposted_concessions_count: number;
  unposted_concessions_amount: number;
  unposted_settlements_count: number;
  unposted_settlements_amount: number;
  accounting_exceptions_count: number;
  posted_journals_count: number;
  posted_journals_amount: number;
  general_ledger_configured: boolean;
}

interface ReadinessRecord {
  record_id: string;
  source_type: 'PAYMENT' | 'FEE_ASSESSMENT' | 'CONCESSION' | 'SETTLEMENT';
  source_reference: string;
  source_date: string;
  student_id?: string | null;
  student_name?: string | null;
  admission_no?: string | null;
  amount: number;
  currency_code: string;
  operational_status: string;
  reconciliation_status: string;
  accounting_readiness_status: 'READY_FOR_GL' | 'REQUIRES_REVIEW' | 'BLOCKED_BY_RECONCILIATION';
  suggested_debit_account: string;
  suggested_credit_account: string;
  notes?: string;
}

interface AccountItem {
  account_code: string;
  account_name: string;
  account_type: string;
  normal_balance: string;
  description: string;
  is_system_standard: boolean;
}

export const FinanceAccounting: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'readiness' | 'accounts' | 'journals' | 'ledger' | 'exceptions'>('overview');
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [records, setRecords] = useState<ReadinessRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);

  // Simulation Drawer
  const [simulatedRecord, setSimulatedRecord] = useState<ReadinessRecord | null>(null);

  const fetchSummary = async () => {
    try {
      const res = await apiClient.get('/fees/accounting/summary');
      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load accounting summary:', err);
    }
  };

  const fetchReadiness = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/fees/accounting/readiness', {
        params: {
          sourceType: sourceTypeFilter,
          search: searchTerm || undefined,
          limit,
          offset: (page - 1) * limit,
        },
      });
      if (res.data?.success) {
        setRecords(res.data.data || []);
        setTotalCount(res.data.pagination?.total || 0);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch accounting readiness records');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await apiClient.get('/fees/accounting/accounts');
      if (res.data?.success) {
        setAccounts(res.data.data?.accounts || []);
      }
    } catch (err: any) {
      console.error('Failed to load accounts:', err);
    }
  };

  const fetchExceptions = async () => {
    try {
      const res = await apiClient.get('/fees/accounting/exceptions');
      if (res.data?.success) {
        setExceptions(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load exceptions:', err);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchAccounts();
    fetchExceptions();
  }, []);

  useEffect(() => {
    fetchReadiness();
  }, [sourceTypeFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReadiness();
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (sourceTypeFilter !== 'all') params.append('sourceType', sourceTypeFilter);
    if (searchTerm) params.append('search', searchTerm);
    window.open(`/api/v1/fees/accounting/export?${params.toString()}`, '_blank');
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Finance Accounting & General Ledger</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Schema Frozen
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Operational transaction readiness, debit/credit mappings, double-entry simulation, and downstream ERP integration.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchSummary();
              fetchReadiness();
              fetchAccounts();
              fetchExceptions();
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── Capability Notice Banner ── */}
      <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3.5">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs md:text-sm text-amber-200/90 leading-relaxed">
          <div className="font-semibold text-amber-300">Stage-1 Architectural Constraint: General Ledger Schema Frozen</div>
          <p>
            The physical PostgreSQL schema lacks durable <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300">chart_of_accounts</code>,{' '}
            <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300">journal_entries</code>, and <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300">accounting_periods</code> tables.
            Operational financial collections, assessments, and concessions are tracked with <strong>readiness tags</strong> and <strong>double-entry mappings</strong>.
            Authoritative journal posting is not faked; instead, draft entries can be simulated and exported for external accounting integration.
          </p>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'overview', label: 'Accounting Overview', icon: Scale },
          { id: 'readiness', label: 'Readiness Register', icon: FileCheck },
          { id: 'accounts', label: 'Chart of Accounts Model', icon: BookOpen },
          { id: 'journals', label: 'Double-Entry Simulation', icon: Receipt },
          { id: 'ledger', label: 'Trial Balance & GL Status', icon: FileSpreadsheet },
          { id: 'exceptions', label: `Accounting Exceptions (${summary?.accounting_exceptions_count ?? 0})`, icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SCREEN A: OVERVIEW
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Awaiting Accounting</span>
                <Clock className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                ₹{summary?.transactions_awaiting_accounting_amount.toLocaleString('en-IN') ?? '0'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {summary?.transactions_awaiting_accounting_count ?? 0} operational events ready for GL
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Unposted Fee Assessments</span>
                <Receipt className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                ₹{summary?.unposted_fee_assessments_amount.toLocaleString('en-IN') ?? '0'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {summary?.unposted_fee_assessments_count ?? 0} fee due obligations
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Unposted Collections</span>
                <Coins className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-400">
                ₹{summary?.unposted_payments_amount.toLocaleString('en-IN') ?? '0'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {summary?.unposted_payments_count ?? 0} collected payments
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Unposted Concessions</span>
                <Scale className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-400">
                ₹{summary?.unposted_concessions_amount.toLocaleString('en-IN') ?? '0'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {summary?.unposted_concessions_count ?? 0} applied waivers
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Net Settlements</span>
                <Coins className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-cyan-400">
                ₹{summary?.unposted_settlements_amount.toLocaleString('en-IN') ?? '0'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {summary?.unposted_settlements_count ?? 0} gateway bank disbursements
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Accounting Exceptions</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400">
                {summary?.accounting_exceptions_count ?? 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Discrepancies requiring review
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Posted Journal Entries</span>
                <FileCheck className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-slate-400">
                0
              </div>
              <div className="text-xs text-amber-400/80 mt-1 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Blocked by Schema Freeze
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">General Ledger Status</span>
                <Info className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-xl font-bold text-amber-400">
                Unconfigured
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Readiness tracking active
              </div>
            </div>
          </div>

          {/* Capabilities Matrix Table */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-400" />
              <span>Phase 11 Accounting Capability Matrix (Authoritative Schema Audit)</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Accounting Capability</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Physical Schema Evidence</th>
                    <th className="py-3 px-4">Handling in Phase 11</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">1. Chart of Accounts</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Blocked by Schema Freeze</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">No physical `chart_of_accounts` table in PostgreSQL</td>
                    <td className="py-3 px-4 text-xs">Standard educational model provided for export mapping</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">2. Journal Headers & Lines</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Blocked by Schema Freeze</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">No physical `journal_entries` or `journal_lines` tables</td>
                    <td className="py-3 px-4 text-xs">Simulated in-memory for preview; persistence strictly gated</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">3. Double-Entry Validation</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Available (Domain Engine)</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">Mathematical engine: `total_debits === total_credits`</td>
                    <td className="py-3 px-4 text-xs">Enforces decimal-safe balance checks on all operational mappings</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">4. Fiscal Periods & Closing</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Blocked by Schema Freeze</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">Only `academic_years` exists; no accounting period close tables</td>
                    <td className="py-3 px-4 text-xs">Period closing mutation disabled; disclosed truthfully</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">5. Payment Accounting Readiness</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Available</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">Verified `payment_transactions` & `payment_allocations`</td>
                    <td className="py-3 px-4 text-xs">Tracked with 1010 (Bank Clearing) & 1200 (AR) accounts</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">6. Fee Assessment Readiness</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Available</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">Verified `student_charges` & `student_charge_dues`</td>
                    <td className="py-3 px-4 text-xs">Tracked with 1200 (AR) & 4000 (Tuition Revenue) accounts</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">7. Concession & Scholarship Accounting</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Available</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">Verified `scholarship_concessions` (status = applied)</td>
                    <td className="py-3 px-4 text-xs">Mapped to 4900 Contra-Revenue without double-deduction</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">8. Gateway Settlement Accounting</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Available</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">Verified `gateway_settlements` & `gateway_settlement_items`</td>
                    <td className="py-3 px-4 text-xs">Splits gross amount, gateway fee expense, and net bank disbursement</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">9. Trial Balance from GL</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Blocked by Schema Freeze</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">No physical ledger accounts or journal line balances</td>
                    <td className="py-3 px-4 text-xs">Reported as unavailable; fake trial balances strictly prohibited</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">10. General Ledger Account Reports</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">Blocked by Schema Freeze</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">No physical journal lines in PostgreSQL</td>
                    <td className="py-3 px-4 text-xs">Reported as unavailable; operational balances shown separately</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-white">11. Audit Trail & Reversals</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Partially Available</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">Operational adjustments in `payment_adjustments` & `payment_refunds`</td>
                    <td className="py-3 px-4 text-xs">Operational refunds tracked; GL reversal mutations blocked</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          SCREEN B: ACCOUNTING READINESS REGISTER
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'readiness' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            {/* Source Type Filter */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800 text-xs font-medium">
              {[
                { id: 'all', label: 'All Sources' },
                { id: 'payment', label: 'Payments' },
                { id: 'fee_assessment', label: 'Fee Assessments' },
                { id: 'concession', label: 'Concessions' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => {
                    setSourceTypeFilter(filter.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    sourceTypeFilter === filter.id
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student, adm no, ref..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {/* Table */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Source Type</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Student Details</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Suggested Debit</th>
                    <th className="py-3 px-4">Suggested Credit</th>
                    <th className="py-3 px-4">Readiness Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                        <span>Loading accounting readiness records...</span>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-red-400">
                        <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                        <span>{error}</span>
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        No operational records found matching the active filters.
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r.record_id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                              r.source_type === 'PAYMENT'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : r.source_type === 'FEE_ASSESSMENT'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}
                          >
                            {r.source_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-white">
                          {r.source_reference}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                          {new Date(r.source_date).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-200">{r.student_name || 'N/A'}</div>
                          <div className="text-xs text-slate-500 font-mono">{r.admission_no || ''}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-white">
                          ₹{r.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-indigo-300">
                          {r.suggested_debit_account}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-emerald-300">
                          {r.suggested_credit_account}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              r.accounting_readiness_status === 'READY_FOR_GL'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : r.accounting_readiness_status === 'BLOCKED_BY_RECONCILIATION'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {r.accounting_readiness_status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setSimulatedRecord(r)}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded text-xs font-medium text-slate-200 transition-colors"
                          >
                            Simulate
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/60 border-t border-slate-800 text-xs text-slate-400">
              <div>
                Showing {records.length} of {totalCount} records (Page {page} of {totalPages})
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-slate-300 px-2">Page {page}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          SCREEN C: CHART OF ACCOUNTS MODEL
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>Standard Educational Chart of Accounts Reference Model</span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Standard General Ledger account mappings utilized for educational ERP transactions.
              Under the Stage-1 schema freeze, institutional custom chart of accounts customization is disabled.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Account Code</th>
                    <th className="py-3 px-4">Account Name</th>
                    <th className="py-3 px-4">Account Type</th>
                    <th className="py-3 px-4">Normal Balance</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {accounts.map((acc) => (
                    <tr key={acc.account_code} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">{acc.account_code}</td>
                      <td className="py-3 px-4 font-medium text-white">{acc.account_name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-700 text-slate-300">
                          {acc.account_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-300">{acc.normal_balance}</td>
                      <td className="py-3 px-4 text-xs text-slate-400">{acc.description}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Standard
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          SCREEN D: DOUBLE-ENTRY SIMULATION
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'journals' && (
        <div className="space-y-6">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-400" />
              <span>Double-Entry Journal Simulator & Balance Validator</span>
            </h2>
            <p className="text-sm text-slate-400">
              Demonstrates mathematical double-entry accounting where <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300">Total Debits === Total Credits</code>.
              Click &quot;Simulate&quot; on any record in the Readiness Register to preview its balanced entries.
            </p>
          </div>

          {/* Sample Interactive Simulation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Payment Collection Journal */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div>
                  <div className="text-xs uppercase font-semibold text-blue-400">Payment Collection Entry</div>
                  <div className="text-sm font-bold text-white">Student Online Payment via Razorpay</div>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Balanced
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-indigo-300">Dr. 1010 - Bank Clearing (Asset +)</span>
                  <span className="text-white font-bold">₹10,000.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 pl-4">
                  <span className="text-emerald-300">Cr. 1200 - Accounts Receivable (Asset -)</span>
                  <span className="text-white font-bold">₹10,000.00</span>
                </div>
              </div>
              <div className="flex justify-between text-xs font-bold pt-2 border-t border-slate-700 text-slate-300">
                <span>Total Debits: ₹10,000.00</span>
                <span>Total Credits: ₹10,000.00</span>
              </div>
            </div>

            {/* Fee Assessment Journal */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div>
                  <div className="text-xs uppercase font-semibold text-emerald-400">Fee Assessment Entry</div>
                  <div className="text-sm font-bold text-white">Term 1 Tuition Fee Obligation Assessment</div>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Balanced
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-indigo-300">Dr. 1200 - Accounts Receivable (Asset +)</span>
                  <span className="text-white font-bold">₹25,000.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 pl-4">
                  <span className="text-emerald-300">Cr. 4000 - Tuition Fee Revenue (Revenue +)</span>
                  <span className="text-white font-bold">₹25,000.00</span>
                </div>
              </div>
              <div className="flex justify-between text-xs font-bold pt-2 border-t border-slate-700 text-slate-300">
                <span>Total Debits: ₹25,000.00</span>
                <span>Total Credits: ₹25,000.00</span>
              </div>
            </div>

            {/* Concession Journal */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div>
                  <div className="text-xs uppercase font-semibold text-purple-400">Concession Applied Entry</div>
                  <div className="text-sm font-bold text-white">Sibling Scholarship Waiver</div>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Balanced
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-indigo-300">Dr. 4900 - Scholarship Contra-Revenue (Rev -)</span>
                  <span className="text-white font-bold">₹5,000.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 pl-4">
                  <span className="text-emerald-300">Cr. 1200 - Accounts Receivable (Asset -)</span>
                  <span className="text-white font-bold">₹5,000.00</span>
                </div>
              </div>
              <div className="flex justify-between text-xs font-bold pt-2 border-t border-slate-700 text-slate-300">
                <span>Total Debits: ₹5,000.00</span>
                <span>Total Credits: ₹5,000.00</span>
              </div>
            </div>

            {/* Gateway Settlement Journal */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div>
                  <div className="text-xs uppercase font-semibold text-cyan-400">Gateway Settlement Entry</div>
                  <div className="text-sm font-bold text-white">Razorpay Net Bank Disbursement</div>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Balanced
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-indigo-300">Dr. 1020 - Operating Bank Account (Asset +)</span>
                  <span className="text-white font-bold">₹49,115.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-indigo-300">Dr. 5100 - Gateway Processing Fees (Expense +)</span>
                  <span className="text-white font-bold">₹885.00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800 pl-4">
                  <span className="text-emerald-300">Cr. 1010 - Bank Clearing (Asset -)</span>
                  <span className="text-white font-bold">₹50,000.00</span>
                </div>
              </div>
              <div className="flex justify-between text-xs font-bold pt-2 border-t border-slate-700 text-slate-300">
                <span>Total Debits: ₹50,000.00</span>
                <span>Total Credits: ₹50,000.00</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          SCREEN E: TRIAL BALANCE & GENERAL LEDGER STATUS
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">General Ledger & Trial Balance Availability Notice</h2>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  A trial balance cannot be generated from an authoritative General Ledger because no physical journal entry lines or account balance tables exist in PostgreSQL.
                  In adherence with project financial controls, fake account balances are not fabricated. Below is the operational summary of assessed, collected, and waived funds.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-semibold text-slate-400 uppercase">Total Assessed Receivables</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  ₹{summary?.unposted_fee_assessments_amount.toLocaleString('en-IN') ?? '0'}
                </div>
                <div className="text-xs text-slate-500 mt-1">from student_charge_dues</div>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-semibold text-slate-400 uppercase">Total Collected Funds</div>
                <div className="text-xl font-bold text-blue-400 mt-1">
                  ₹{summary?.unposted_payments_amount.toLocaleString('en-IN') ?? '0'}
                </div>
                <div className="text-xs text-slate-500 mt-1">from payment_transactions</div>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-semibold text-slate-400 uppercase">Total Applied Concessions</div>
                <div className="text-xl font-bold text-purple-400 mt-1">
                  ₹{summary?.unposted_concessions_amount.toLocaleString('en-IN') ?? '0'}
                </div>
                <div className="text-xs text-slate-500 mt-1">from scholarship_concessions</div>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="text-xs font-semibold text-slate-400 uppercase">Net Settled Disbursements</div>
                <div className="text-xl font-bold text-cyan-400 mt-1">
                  ₹{summary?.unposted_settlements_amount.toLocaleString('en-IN') ?? '0'}
                </div>
                <div className="text-xs text-slate-500 mt-1">from gateway_settlements</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          SCREEN F: ACCOUNTING EXCEPTIONS QUEUE
         ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'exceptions' && (
        <div className="space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Accounting Review Exceptions Queue</span>
            </h2>
            <p className="text-sm text-slate-400">
              Transactions requiring operational or reconciliation resolution before general ledger export.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Exception Type</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Gateway Reference</th>
                    <th className="py-3 px-4">Failure Reason</th>
                    <th className="py-3 px-4">Recommended Next Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {exceptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No active accounting exceptions found. All operational records are clear.
                      </td>
                    </tr>
                  ) : (
                    exceptions.map((ex) => (
                      <tr key={ex.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {ex.exception_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          ₹{Number(ex.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-200">{ex.student_name}</div>
                          <div className="text-xs text-slate-500 font-mono">{ex.admission_no}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-400">
                          {ex.gateway_transaction_id || ex.order_reference || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-xs text-red-300 font-mono">
                          {ex.failure_code || 'EXCEEDS_REMAINING_DUE'}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-300">
                          {ex.recommended_action}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Simulation Modal / Drawer ── */}
      {simulatedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-800/50">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Simulated Double-Entry Journal Entry</h3>
              </div>
              <button
                onClick={() => setSimulatedRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-300 flex items-center gap-2">
                <Lock className="w-4 h-4 flex-shrink-0" />
                <span>Simulation Only: Physical journal entry persistence is blocked by the database schema freeze.</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500">Source Event:</span>{' '}
                  <span className="font-semibold text-white">{simulatedRecord.source_type}</span>
                </div>
                <div>
                  <span className="text-slate-500">Reference:</span>{' '}
                  <span className="font-mono text-white">{simulatedRecord.source_reference}</span>
                </div>
                <div>
                  <span className="text-slate-500">Student:</span>{' '}
                  <span className="text-white">{simulatedRecord.student_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Transaction Amount:</span>{' '}
                  <span className="font-mono font-bold text-emerald-400">
                    ₹{simulatedRecord.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Debit / Credit lines */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Double-Entry Lines</div>
                <div className="space-y-2 bg-slate-800/40 p-4 rounded-xl border border-slate-800 font-mono text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                    <span className="text-indigo-300">Dr. {simulatedRecord.suggested_debit_account}</span>
                    <span className="text-white font-bold">
                      ₹{simulatedRecord.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-700/60 pl-6">
                    <span className="text-emerald-300">Cr. {simulatedRecord.suggested_credit_account}</span>
                    <span className="text-white font-bold">
                      ₹{simulatedRecord.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-200 bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Balanced (Debits = Credits)
                </span>
                <span className="font-mono">Diff: ₹0.00</span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-800/50 flex justify-end">
              <button
                onClick={() => setSimulatedRecord(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-white transition-colors"
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

export default FinanceAccounting;
