import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
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
  HelpCircle
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================
type AuditTab =
  | 'overview'
  | 'payments'
  | 'settlements'
  | 'concessions'
  | 'webhooks'
  | 'accounting_readiness'
  | 'controls'
  | 'exports';

interface AuditSummaryData {
  unallocated_payments: {
    count: number;
    amount: number;
    status: 'VERIFIED' | 'REVIEW_REQUIRED';
  };
  reconciliation_exceptions: {
    count: number;
    amount: number;
    status: 'VERIFIED' | 'POTENTIAL_EXCEPTION';
  };
  unmatched_settlements: {
    count: number;
    amount: number;
    status: 'VERIFIED' | 'REVIEW_REQUIRED';
  };
  webhook_lifecycle_exceptions: {
    total_exceptions: number;
    failed_count: number;
    unprocessed_count: number;
    status: 'VERIFIED' | 'POTENTIAL_EXCEPTION';
  };
  concessions_governance: {
    pending_review_count: number;
    approved_count: number;
    applied_count: number;
    rejected_count: number;
    status: 'VERIFIED' | 'REVIEW_REQUIRED';
  };
  data_relationship_integrity: {
    missing_due_dates_count: number;
    status: 'VERIFIED' | 'POTENTIAL_EXCEPTION';
  };
  accounting_readiness_audit: {
    general_ledger_structures_available: boolean;
    status: string;
    notice: string;
  };
}

interface PaymentAuditRecord {
  payment_transaction_id: string;
  payment_order_id: string;
  order_reference: string;
  student_id: string;
  student_name: string;
  admission_no: string;
  transaction_amount: number;
  currency_code: string;
  transaction_status: string;
  payment_method: string;
  gateway_transaction_id: string;
  transaction_date: string;
  total_allocated: number;
  unallocated_amount: number;
  allocation_classification: 'UNALLOCATED_CAPTURED_FUNDS' | 'PARTIALLY_ALLOCATED' | 'FULLY_ALLOCATED' | 'NON_SUCCESS_TRANSACTION';
  audit_flag_raised: boolean;
}

interface SettlementAuditRecord {
  gateway_settlement_id: string;
  provider_name: string;
  provider_settlement_id: string;
  settlement_reference: string;
  settlement_date: string;
  currency_code: string;
  gross_amount: number;
  fee_amount: number;
  tax_amount: number;
  other_adjustment_amount: number;
  net_settlement_amount: number;
  calculated_net_amount: number;
  arithmetic_discrepancy: number;
  settlement_audit_status: 'ARITHMETIC_MISMATCH' | 'SETTLED_AND_RECONCILED' | 'UNMATCHED_SETTLEMENT' | 'PARTIALLY_RECONCILED';
  provider_status: string;
  settled_at: string;
  total_match_records: number;
  verified_matches_count: number;
}

interface ConcessionAuditRecord {
  concession_id: string;
  student_id: string;
  student_name: string;
  admission_no: string;
  student_user_id: string;
  scholarship_type: string;
  percentage: number;
  discount_amount: number;
  concession_status: string;
  scope: string;
  created_at: string;
  created_by: string;
  latest_action: string | null;
  latest_action_by: string | null;
  latest_action_at: string | null;
  latest_remarks: string | null;
  control_finding: 'POTENTIAL_SELF_APPROVAL_VIOLATION' | 'APPROVED_WITHOUT_APPROVAL_HISTORY' | 'AWAITING_GOVERNANCE_REVIEW' | 'REJECTED_CONCESSION' | 'VERIFIED_CONCESSION_LIFECYCLE';
}

interface WebhookAuditRecord {
  payment_webhook_event_id: string;
  provider_name: string;
  provider_event_id: string;
  event_type: string;
  payment_order_id: string | null;
  payment_transaction_id: string | null;
  webhook_status: string;
  received_at: string;
  processed_at: string | null;
  processing_error: string | null;
  webhook_finding: 'PROCESSING_FAILURE_EXCEPTION' | 'STALLED_UNPROCESSED_WEBHOOK' | 'AWAITING_ASYNC_PROCESSING' | 'NON_FINANCIAL_IGNORED_EVENT' | 'SUCCESSFULLY_RECONCILED';
}

interface ControlMatrixItem {
  control_id: string;
  control_name: string;
  domain: string;
  source_records: string;
  evaluation_condition: string;
  finding_count: number;
  finding_amount: number;
  status: string;
  evidence_completeness: string;
  limitation: string | null;
  recommended_action: string;
}

interface ControlMatrixResponse {
  evaluated_at: string;
  tenant_org_id: string;
  total_controls: number;
  active_controls: number;
  blocked_controls: number;
  controls: ControlMatrixItem[];
}

export const FinanceAudit: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<AuditTab>('overview');

  // Loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Data states
  const [summary, setSummary] = useState<AuditSummaryData | null>(null);
  const [capabilities, setCapabilities] = useState<any>(null);
  const [controlMatrix, setControlMatrix] = useState<ControlMatrixResponse | null>(null);
  const [accountingData, setAccountingData] = useState<any>(null);

  // Paginated registers
  const [payments, setPayments] = useState<{ total: number; page: number; limit: number; total_pages: number; data: PaymentAuditRecord[] }>({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 1,
    data: []
  });

  const [settlements, setSettlements] = useState<{ total: number; page: number; limit: number; total_pages: number; data: SettlementAuditRecord[] }>({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 1,
    data: []
  });

  const [concessions, setConcessions] = useState<{ total: number; page: number; limit: number; total_pages: number; data: ConcessionAuditRecord[] }>({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 1,
    data: []
  });

  const [webhooks, setWebhooks] = useState<{ total: number; page: number; limit: number; total_pages: number; data: WebhookAuditRecord[] }>({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 1,
    data: []
  });

  // Filters
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [paymentSearch, setPaymentSearch] = useState<string>('');
  const [settlementSearch, setSettlementSearch] = useState<string>('');
  const [concessionSearch, setConcessionSearch] = useState<string>('');
  const [webhookSearch, setWebhookSearch] = useState<string>('');

  // Status badge styling helper
  const getFindingBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'SUCCESSFULLY_RECONCILED':
      case 'FULLY_ALLOCATED':
      case 'VERIFIED_CONCESSION_LIFECYCLE':
      case 'SETTLED_AND_RECONCILED':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Verified'
        };
      case 'PARTIALLY_ALLOCATED':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          label: 'Partially Allocated (Active)'
        };
      case 'REVIEW_REQUIRED':
      case 'AWAITING_GOVERNANCE_REVIEW':
      case 'AWAITING_ASYNC_PROCESSING':
      case 'PARTIALLY_RECONCILED':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Review Required'
        };
      case 'POTENTIAL_EXCEPTION':
      case 'UNALLOCATED_CAPTURED_FUNDS':
      case 'ARITHMETIC_MISMATCH':
      case 'POTENTIAL_SELF_APPROVAL_VIOLATION':
      case 'APPROVED_WITHOUT_APPROVAL_HISTORY':
      case 'PROCESSING_FAILURE_EXCEPTION':
      case 'STALLED_UNPROCESSED_WEBHOOK':
      case 'UNMATCHED_SETTLEMENT':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          label: status.replace(/_/g, ' ')
        };
      case 'BLOCKED_BY_SCHEMA_FREEZE':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
          label: 'Blocked by Schema Freeze'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          label: status
        };
    }
  };

  // Fetch summary and capabilities
  const fetchOverview = async () => {
    try {
      const [sumRes, capRes] = await Promise.all([
        apiClient.get('/fees/audit/summary'),
        apiClient.get('/fees/audit/capabilities')
      ]);
      if (sumRes.data?.success) setSummary(sumRes.data.data);
      if (capRes.data?.success) setCapabilities(capRes.data.data);
    } catch (err: any) {
      console.error('Error fetching audit overview:', err);
      toast.error('Failed to load financial audit summary');
    }
  };

  // Fetch payment audit register
  const fetchPayments = async (page = 1) => {
    try {
      const res = await apiClient.get(
        `/fees/audit/payments?page=${page}&limit=20&status=${paymentStatusFilter}&search=${encodeURIComponent(paymentSearch)}`
      );
      if (res.data?.success) setPayments(res.data.data);
    } catch (err: any) {
      console.error('Error fetching payment audit:', err);
    }
  };

  // Fetch settlement audit register
  const fetchSettlements = async (page = 1) => {
    try {
      const res = await apiClient.get(
        `/fees/audit/settlements?page=${page}&limit=20&search=${encodeURIComponent(settlementSearch)}`
      );
      if (res.data?.success) setSettlements(res.data.data);
    } catch (err: any) {
      console.error('Error fetching settlements audit:', err);
    }
  };

  // Fetch concessions audit register
  const fetchConcessions = async (page = 1) => {
    try {
      const res = await apiClient.get(
        `/fees/audit/concessions?page=${page}&limit=20&search=${encodeURIComponent(concessionSearch)}`
      );
      if (res.data?.success) setConcessions(res.data.data);
    } catch (err: any) {
      console.error('Error fetching concessions audit:', err);
    }
  };

  // Fetch webhooks audit register
  const fetchWebhooks = async (page = 1) => {
    try {
      const res = await apiClient.get(
        `/fees/audit/webhooks?page=${page}&limit=20&search=${encodeURIComponent(webhookSearch)}`
      );
      if (res.data?.success) setWebhooks(res.data.data);
    } catch (err: any) {
      console.error('Error fetching webhooks audit:', err);
    }
  };

  // Fetch control matrix
  const fetchControlMatrix = async () => {
    try {
      const res = await apiClient.get('/fees/audit/coverage');
      if (res.data?.success) setControlMatrix(res.data.data);
    } catch (err: any) {
      console.error('Error fetching control matrix:', err);
    }
  };

  // Fetch accounting readiness audit
  const fetchAccounting = async () => {
    try {
      const res = await apiClient.get('/fees/audit/accounting-readiness');
      if (res.data?.success) setAccountingData(res.data.data);
    } catch (err: any) {
      console.error('Error fetching accounting readiness:', err);
    }
  };

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchOverview(),
        fetchPayments(1),
        fetchSettlements(1),
        fetchConcessions(1),
        fetchWebhooks(1),
        fetchControlMatrix(),
        fetchAccounting()
      ]);
      setLoading(false);
    };
    loadAll();
  }, []);

  // Filter triggers
  useEffect(() => {
    fetchPayments(1);
  }, [paymentStatusFilter]);

  // CSV Export Trigger
  const handleExportCSV = (exportType: 'payments' | 'settlements' | 'concessions' | 'webhooks' | 'controls') => {
    toast.info(`Preparing ${exportType.toUpperCase()} CSV export...`);
    const url = `/api/fees/audit/export?exportType=${exportType}`;
    window.open(url, '_blank');
    toast.success('Sanitized audit export generated');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* HEADER & GOVERNANCE BANNER */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-bold text-slate-900">Finance Audit, Governance & Compliance</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Stage 4 Phase 14
                </span>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Read-Only Oversight
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Deterministic oversight over student billing, payment allocations, gateway settlements, concessions, and accounting controls.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={async () => {
                  setRefreshing(true);
                  await Promise.all([
                    fetchOverview(),
                    fetchPayments(payments.page),
                    fetchSettlements(settlements.page),
                    fetchConcessions(concessions.page),
                    fetchWebhooks(webhooks.page),
                    fetchControlMatrix(),
                    fetchAccounting()
                  ]);
                  setRefreshing(false);
                  toast.success('Audit workspace refreshed with verified operational data');
                }}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Auditing...' : 'Refresh Audit'}
              </button>

              <button
                onClick={() => setActiveTab('exports')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Audit Evidence Export
              </button>
            </div>
          </div>

          {/* Schema Freeze Disclosure */}
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-md flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Stage-1 Schema Freeze Active:</strong> Durable audit log tables are not present in physical PostgreSQL. This workspace computes read-only deterministic findings directly over active operational tables. No records are altered.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded border text-[11px] font-semibold bg-white border-amber-300 text-amber-800">
              Immutable PostgreSQL
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-4 overflow-x-auto border-b border-slate-100 pb-1 scrollbar-none">
            {[
              { id: 'overview', label: 'Audit Overview', icon: ShieldCheck },
              { id: 'payments', label: 'Payment Register', icon: Receipt },
              { id: 'settlements', label: 'Settlement Audit', icon: Scale },
              { id: 'concessions', label: 'Concessions & Waivers', icon: Award },
              { id: 'webhooks', label: 'Webhooks & Dead-Letters', icon: AlertTriangle },
              { id: 'accounting_readiness', label: 'Accounting Readiness', icon: BookOpen },
              { id: 'controls', label: 'Control Matrix (7)', icon: Layers },
              { id: 'exports', label: 'Evidence & Exports', icon: FileSpreadsheet }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AuditTab)}
                  className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MAIN CONTENT AREA */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-slate-200">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-700">Evaluating Financial Audit Controls...</p>
            <p className="text-xs text-slate-400 mt-1">Aggregating payment transactions, dues, settlements, and webhooks.</p>
          </div>
        ) : (
          <>
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SCREEN A: AUDIT OVERVIEW */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'overview' && summary && (
              <div className="space-y-6">
                {/* Primary KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* KPI 1: Unallocated Payments */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unallocated Funds</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getFindingBadge(summary.unallocated_payments.status).bg}`}>
                        {getFindingBadge(summary.unallocated_payments.status).label}
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900">
                        ₹{summary.unallocated_payments.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {summary.unallocated_payments.count} captured payment(s) without full fee ledger allocation.
                    </p>
                    <button
                      onClick={() => setActiveTab('payments')}
                      className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                    >
                      Audit Register &rarr;
                    </button>
                  </div>

                  {/* KPI 2: Reconciliation Exceptions */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recon Exceptions</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getFindingBadge(summary.reconciliation_exceptions.status).bg}`}>
                        {getFindingBadge(summary.reconciliation_exceptions.status).label}
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900">{summary.reconciliation_exceptions.count}</span>
                      <span className="text-xs text-slate-500">Unresolved Items</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      ₹{summary.reconciliation_exceptions.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} matched amount needing reconciliation review.
                    </p>
                    <button
                      onClick={() => setActiveTab('settlements')}
                      className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                    >
                      Inspect Settlements &rarr;
                    </button>
                  </div>

                  {/* KPI 3: Webhook Dead-Letters */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Webhook Failures</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getFindingBadge(summary.webhook_lifecycle_exceptions.status).bg}`}>
                        {getFindingBadge(summary.webhook_lifecycle_exceptions.status).label}
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900">
                        {summary.webhook_lifecycle_exceptions.failed_count}
                      </span>
                      <span className="text-xs text-slate-500">
                        Failed / {summary.webhook_lifecycle_exceptions.unprocessed_count} Stalled
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Payment gateway events requiring idempotent replay or signature inspection.
                    </p>
                    <button
                      onClick={() => setActiveTab('webhooks')}
                      className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                    >
                      Webhook Log &rarr;
                    </button>
                  </div>

                  {/* KPI 4: Concession Reviews */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Concession Reviews</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getFindingBadge(summary.concessions_governance.status).bg}`}>
                        {getFindingBadge(summary.concessions_governance.status).label}
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-900">
                        {summary.concessions_governance.pending_review_count}
                      </span>
                      <span className="text-xs text-slate-500">Awaiting Governance</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {summary.concessions_governance.approved_count} approved / {summary.concessions_governance.applied_count} applied to active fee ledgers.
                    </p>
                    <button
                      onClick={() => setActiveTab('concessions')}
                      className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                    >
                      Audit Concessions &rarr;
                    </button>
                  </div>
                </div>

                {/* Secondary Oversight & Data Integrity Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Relationship Integrity */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-sm font-bold text-slate-900">Data Relationship & Billing Schedule Integrity</h3>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getFindingBadge(summary.data_relationship_integrity.status).bg}`}>
                        {getFindingBadge(summary.data_relationship_integrity.status).label}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                        <span className="text-slate-600">Active student charge obligations missing explicit due date:</span>
                        <span className="font-bold text-slate-900">{summary.data_relationship_integrity.missing_due_dates_count} record(s)</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                        <span className="text-slate-600">Unmatched gateway settlements requiring clearing:</span>
                        <span className="font-bold text-slate-900">{summary.unmatched_settlements.count} batch(es)</span>
                      </div>
                    </div>
                  </div>

                  {/* Accounting Readiness Limitation Disclosure */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-sm font-bold text-slate-900">Accounting Readiness & General Ledger Governance</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold border bg-purple-50 text-purple-700 border-purple-200">
                        Schema Freeze
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {summary.accounting_readiness_audit.notice}
                    </p>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Formal General Ledger Audit:</span>
                      <span className="text-xs font-bold text-rose-600">Blocked (No durable journal tables)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SCREEN B: PAYMENT AUDIT REGISTER */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'payments' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Payment Audit Register</h3>
                    <p className="text-xs text-slate-500">
                      Authoritative payment transactions, gateway matching, and fee ledger allocation status.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search student, order, ref..."
                        value={paymentSearch}
                        onChange={(e) => setPaymentSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchPayments(1)}
                        className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-56"
                      />
                    </div>

                    <select
                      value={paymentStatusFilter}
                      onChange={(e) => setPaymentStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none bg-white font-medium text-slate-700"
                    >
                      <option value="all">All Statuses</option>
                      <option value="success">Success</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>

                    <button
                      onClick={() => handleExportCSV('payments')}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-slate-200"
                      title="Export Payments CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Order / Tx Reference</th>
                        <th className="px-4 py-3">Student & Admission</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Allocated</th>
                        <th className="px-4 py-3">Unallocated</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Allocation Classification</th>
                        <th className="px-4 py-3">Tx Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.data.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-slate-400">
                            No payment audit records found matching active filter.
                          </td>
                        </tr>
                      ) : (
                        payments.data.map((p) => {
                          const badge = getFindingBadge(p.allocation_classification);
                          return (
                            <tr key={p.payment_transaction_id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3 font-mono text-[11px] text-slate-900">
                                <div>{p.order_reference}</div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                  {p.gateway_transaction_id || p.payment_transaction_id}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-900">{p.student_name}</div>
                                <div className="text-[11px] text-slate-400">Adm: {p.admission_no}</div>
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-900">
                                ₹{p.transaction_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-emerald-700 font-medium">
                                ₹{p.total_allocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3">
                                {p.unallocated_amount > 0 ? (
                                  <span className="font-bold text-rose-600">
                                    ₹{p.unallocated_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">₹0.00</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  p.transaction_status === 'success'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                  {p.transaction_status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}`}>
                                  {badge.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                {new Date(p.transaction_date).toLocaleDateString()}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Showing {payments.data.length} of {payments.total} records (Page {payments.page} of {payments.total_pages})
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => fetchPayments(payments.page - 1)}
                      disabled={payments.page <= 1}
                      className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => fetchPayments(payments.page + 1)}
                      disabled={payments.page >= payments.total_pages}
                      className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SCREEN C: SETTLEMENT AUDIT */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'settlements' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Settlement & Gateway Clearing Audit</h3>
                    <p className="text-xs text-slate-500">
                      Arithmetic tolerance checks, gateway fee deductions, and bank statement match verification.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search UTR, provider ref..."
                        value={settlementSearch}
                        onChange={(e) => setSettlementSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchSettlements(1)}
                        className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-56"
                      />
                    </div>
                    <button
                      onClick={() => handleExportCSV('settlements')}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-slate-200"
                      title="Export Settlements CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Settlement Reference / UTR</th>
                        <th className="px-4 py-3">Provider</th>
                        <th className="px-4 py-3">Gross</th>
                        <th className="px-4 py-3">Fees & Taxes</th>
                        <th className="px-4 py-3">Net Amount</th>
                        <th className="px-4 py-3">Calculated Net</th>
                        <th className="px-4 py-3">Discrepancy</th>
                        <th className="px-4 py-3">Audit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {settlements.data.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-slate-400">
                            No settlement audit records found.
                          </td>
                        </tr>
                      ) : (
                        settlements.data.map((s) => {
                          const badge = getFindingBadge(s.settlement_audit_status);
                          return (
                            <tr key={s.gateway_settlement_id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3 font-mono text-[11px] text-slate-900">
                                <div>{s.settlement_reference || 'N/A'}</div>
                                <div className="text-[10px] text-slate-400">{s.provider_settlement_id}</div>
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-800">
                                {s.provider_name}
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-900">
                                ₹{s.gross_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                ₹{(s.fee_amount + s.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 font-bold text-emerald-700">
                                ₹{s.net_settlement_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-slate-700">
                                ₹{s.calculated_net_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3">
                                {s.arithmetic_discrepancy > 0.01 ? (
                                  <span className="font-bold text-rose-600">
                                    ₹{s.arithmetic_discrepancy.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-emerald-600">₹0.00</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}`}>
                                  {badge.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Showing {settlements.data.length} of {settlements.total} records (Page {settlements.page} of {settlements.total_pages})
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => fetchSettlements(settlements.page - 1)}
                      disabled={settlements.page <= 1}
                      className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => fetchSettlements(settlements.page + 1)}
                      disabled={settlements.page >= settlements.total_pages}
                      className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SCREEN D: CONCESSION & SCHOLARSHIP AUDIT */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'concessions' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Scholarship & Concession Governance Audit</h3>
                    <p className="text-xs text-slate-500">
                      Approval verification, segregation of duties enforcement, and self-approval violation detection.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search student, scholarship..."
                        value={concessionSearch}
                        onChange={(e) => setConcessionSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchConcessions(1)}
                        className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-56"
                      />
                    </div>
                    <button
                      onClick={() => handleExportCSV('concessions')}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-slate-200"
                      title="Export Concessions CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Student & Admission</th>
                        <th className="px-4 py-3">Scholarship Type</th>
                        <th className="px-4 py-3">Concession %</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Latest Action</th>
                        <th className="px-4 py-3">Action By (Actor)</th>
                        <th className="px-4 py-3">Control Finding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {concessions.data.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400">
                            No scholarship concession records found.
                          </td>
                        </tr>
                      ) : (
                        concessions.data.map((c) => {
                          const badge = getFindingBadge(c.control_finding);
                          return (
                            <tr key={c.concession_id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-900">{c.student_name}</div>
                                <div className="text-[11px] text-slate-400">Adm: {c.admission_no}</div>
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-800 uppercase">
                                {c.scholarship_type.replace(/_/g, ' ')}
                              </td>
                              <td className="px-4 py-3 font-bold text-indigo-700">
                                {c.percentage}%
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  c.concession_status === 'applied'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : c.concession_status === 'approved'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {c.concession_status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {c.latest_action || 'No History'}
                              </td>
                              <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                                {c.latest_action_by ? c.latest_action_by.substring(0, 8) + '...' : 'System'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}`}>
                                  {badge.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Showing {concessions.data.length} of {concessions.total} records (Page {concessions.page} of {concessions.total_pages})
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => fetchConcessions(concessions.page - 1)}
                      disabled={concessions.page <= 1}
                      className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => fetchConcessions(concessions.page + 1)}
                      disabled={concessions.page >= concessions.total_pages}
                      className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SCREEN E: WEBHOOK & RECOVERY AUDIT */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'webhooks' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Webhook & Dead-Letter Event Audit</h3>
                    <p className="text-xs text-slate-500">
                      Payment gateway asynchronous event lifecycle, delivery latency, and failure logs.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search provider, event..."
                        value={webhookSearch}
                        onChange={(e) => setWebhookSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchWebhooks(1)}
                        className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-56"
                      />
                    </div>
                    <button
                      onClick={() => handleExportCSV('webhooks')}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg border border-slate-200"
                      title="Export Webhooks CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Event ID / Provider</th>
                        <th className="px-4 py-3">Event Type</th>
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Received At</th>
                        <th className="px-4 py-3">Processing Error</th>
                        <th className="px-4 py-3">Audit Finding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {webhooks.data.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400">
                            No webhook events recorded in audit window.
                          </td>
                        </tr>
                      ) : (
                        webhooks.data.map((w) => {
                          const badge = getFindingBadge(w.webhook_finding);
                          return (
                            <tr key={w.payment_webhook_event_id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3 font-mono text-[11px] text-slate-900">
                                <div>{w.provider_event_id}</div>
                                <div className="text-[10px] text-slate-400">{w.provider_name}</div>
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-800">
                                {w.event_type}
                              </td>
                              <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                                {w.payment_order_id ? w.payment_order_id.substring(0, 8) + '...' : 'N/A'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  w.webhook_status === 'processed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : w.webhook_status === 'failed'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {w.webhook_status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                {new Date(w.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-4 py-3 text-rose-600 truncate max-w-[200px]" title={w.processing_error || ''}>
                                {w.processing_error || '—'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}`}>
                                  {badge.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Showing {webhooks.data.length} of {webhooks.total} records (Page {webhooks.page} of {webhooks.total_pages})
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => fetchWebhooks(webhooks.page - 1)}
                      disabled={webhooks.page <= 1}
                      className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => fetchWebhooks(webhooks.page + 1)}
                      disabled={webhooks.page >= webhooks.total_pages}
                      className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SCREEN F: ACCOUNTING READINESS & CONTROL EXCEPTIONS */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'accounting_readiness' && (
              <div className="space-y-6">
                {/* Prominent Schema Freeze Warning */}
                <div className="bg-rose-50 border-2 border-rose-300 p-5 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-rose-950">
                      Formal General Ledger Auditing Blocked Under Immutable Schema Freeze
                    </h3>
                    <p className="text-xs text-rose-900 mt-1 leading-relaxed">
                      The finalized database schema does not include tables for <code className="bg-rose-100 px-1 py-0.5 rounded">chart_of_accounts</code>, <code className="bg-rose-100 px-1 py-0.5 rounded">journal_entries</code>, or <code className="bg-rose-100 px-1 py-0.5 rounded">account_balances</code>.
                      Consequently, formal posted journal auditing, double-entry equality enforcement, and trial balance verification cannot be performed from the database.
                      The metrics below reflect <strong>operational readiness</strong> for downstream financial systems.
                    </p>
                  </div>
                </div>

                {/* Accounting Readiness KPIs */}
                {accountingData?.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Unposted Assessments</span>
                      <div className="mt-2 text-xl font-bold text-slate-900">
                        ₹{(accountingData.summary.unposted_fee_assessments_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {accountingData.summary.unposted_fee_assessments_count || 0} student fee charge(s) awaiting posting.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Unposted Collections</span>
                      <div className="mt-2 text-xl font-bold text-slate-900">
                        ₹{(accountingData.summary.unposted_payments_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {accountingData.summary.unposted_payments_count || 0} successful transaction(s) ready for cash clearing.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Unposted Concessions</span>
                      <div className="mt-2 text-xl font-bold text-slate-900">
                        ₹{(accountingData.summary.unposted_concessions_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {accountingData.summary.unposted_concessions_count || 0} approved concession(s) for contra-revenue journal.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Unposted Settlements</span>
                      <div className="mt-2 text-xl font-bold text-slate-900">
                        ₹{(accountingData.summary.unposted_settlements_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {accountingData.summary.unposted_settlements_count || 0} gateway settlement batch(es) awaiting bank credit.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SCREEN H: AUDIT CONTROL MATRIX */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'controls' && controlMatrix && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Financial Audit Control Matrix</h3>
                    <p className="text-xs text-slate-500">
                      Evaluated register of {controlMatrix.total_controls} defined ERP controls ({controlMatrix.active_controls} active, {controlMatrix.blocked_controls} blocked).
                    </p>
                  </div>
                  <button
                    onClick={() => handleExportCSV('controls')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Control Matrix
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Control ID & Name</th>
                        <th className="px-4 py-3">Domain</th>
                        <th className="px-4 py-3">Source Records</th>
                        <th className="px-4 py-3">Findings</th>
                        <th className="px-4 py-3">Completeness</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Recommended Review Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {controlMatrix.controls.map((ctl) => {
                        const badge = getFindingBadge(ctl.status);
                        return (
                          <tr key={ctl.control_id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-mono font-bold text-indigo-600">{ctl.control_id}</div>
                              <div className="font-semibold text-slate-900 mt-0.5">{ctl.control_name}</div>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-800">
                              {ctl.domain}
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                              {ctl.source_records}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-slate-900">{ctl.finding_count}</span>
                              {ctl.finding_amount > 0 && (
                                <div className="text-[10px] text-slate-500">
                                  ₹{ctl.finding_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {ctl.evidence_completeness}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.bg}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 leading-snug max-w-[280px]">
                              {ctl.recommended_action}
                              {ctl.limitation && (
                                <div className="mt-1 text-[11px] text-purple-700 italic">
                                  Note: {ctl.limitation}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SCREEN G: AUDIT EVIDENCE & CSV EXPORTS */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'exports' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-bold text-slate-900">Financial Audit Evidence & Exports</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    Download formula-injection-protected CSV registers for formal compliance evidence packs.
                    All dangerous leading formula triggers (=, +, -, @, \t, \r) are sanitized with apostrophe escaping.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Export 1: Payments */}
                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <Receipt className="w-6 h-6 text-indigo-600 mb-2" />
                        <h4 className="text-sm font-bold text-slate-900">Payment Audit Register</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Full operational ledger of transactions, allocations, and unallocated captured balances.
                        </p>
                      </div>
                      <button
                        onClick={() => handleExportCSV('payments')}
                        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Payments CSV
                      </button>
                    </div>

                    {/* Export 2: Settlements */}
                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <Scale className="w-6 h-6 text-indigo-600 mb-2" />
                        <h4 className="text-sm font-bold text-slate-900">Settlement Clearing Register</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Settlement gross amounts, fee deductions, net bank transfers, and arithmetic discrepancy checks.
                        </p>
                      </div>
                      <button
                        onClick={() => handleExportCSV('settlements')}
                        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Settlements CSV
                      </button>
                    </div>

                    {/* Export 3: Concessions */}
                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <Award className="w-6 h-6 text-indigo-600 mb-2" />
                        <h4 className="text-sm font-bold text-slate-900">Concession Governance Register</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Scholarship applications, approver audit trails, and segregation of duties checks.
                        </p>
                      </div>
                      <button
                        onClick={() => handleExportCSV('concessions')}
                        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Concessions CSV
                      </button>
                    </div>

                    {/* Export 4: Webhooks */}
                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <AlertTriangle className="w-6 h-6 text-indigo-600 mb-2" />
                        <h4 className="text-sm font-bold text-slate-900">Webhook Dead-Letter Log</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Payment provider webhook events, failure reasons, and stalled delivery logs.
                        </p>
                      </div>
                      <button
                        onClick={() => handleExportCSV('webhooks')}
                        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Webhook CSV
                      </button>
                    </div>

                    {/* Export 5: Control Matrix */}
                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <Layers className="w-6 h-6 text-indigo-600 mb-2" />
                        <h4 className="text-sm font-bold text-slate-900">Audit Control Matrix</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Evaluation status, limitations, and findings for all 7 active and blocked audit controls.
                        </p>
                      </div>
                      <button
                        onClick={() => handleExportCSV('controls')}
                        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Controls CSV
                      </button>
                    </div>
                  </div>

                  {/* Legal Notice */}
                  <div className="mt-8 p-4 bg-slate-100 rounded-xl text-xs text-slate-600 leading-relaxed">
                    <strong>Statutory & Compliance Notice:</strong> These exported registers are operational audit files derived from real database transactions. They do not constitute certified statutory audit reports or formal double-entry General Ledger trial balances, which are blocked under the current database schema freeze.
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FinanceAudit;
