import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../lib/api-client';
import {
  Building2,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Sliders,
  History,
  Lock,
  ChevronRight,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

interface OrganizationConfig {
  org_id: string;
  org_name: string;
  org_code: string;
  board_affiliation: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  phone: string;
  email: string;
  website: string | null;
  subscription_tier: string;
  status: string;
}

interface AcademicYearConfig {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface GatewayStatus {
  name: string;
  status: 'CONFIGURED' | 'NOT_CONFIGURED' | 'PARTIALLY_CONFIGURED';
  environment_mode: 'test' | 'live' | 'unknown';
  key_id_configured: boolean;
  key_secret_configured: boolean;
  webhook_secret_configured: boolean;
  last_validated_at: string | null;
  last_validation_status: 'SUCCESS' | 'FAILED' | 'PENDING' | null;
  setup_instructions: string;
}

interface PaymentMethodItem {
  code: string;
  label: string;
  type: string;
  status: string;
  description: string;
}

interface ConfigurationData {
  organization: OrganizationConfig;
  academic_year: AcademicYearConfig | null;
  currency: {
    code: 'INR';
    symbol: '₹';
    is_editable: false;
    note: string;
  };
  receipts: {
    prefix: 'RCPT';
    format: 'RCPT-YYYY-000001';
    strategy: 'sequential';
    footer_note: string | null;
    is_sequence_editable: false;
    note: string;
  };
  demands: {
    prefix: 'DEM';
    format: 'DEM-YYYY-000001';
    strategy: 'sequential';
    default_payment_window_days: number;
    is_sequence_editable: false;
  };
  payment_methods: PaymentMethodItem[];
  gateway: GatewayStatus;
  operational_defaults: {
    default_payment_window_days: number;
    late_fee_supported: false;
    late_fee_note: string;
  };
  schema_limitations: string[];
  updated_at: string | null;
}

interface AuditLogItem {
  id: string;
  action: string;
  performed_by: string;
  created_at: string;
  details?: Record<string, any>;
}

export const FinanceConfigurationPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ConfigurationData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testingGateway, setTestingGateway] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    status: 'SUCCESS' | 'FAILED' | 'NOT_CONFIGURED';
    message: string;
    timestamp: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<
    'general' | 'currency' | 'methods' | 'gateway' | 'audit' | 'limitations'
  >('general');

  // Form State
  const [form, setForm] = useState({
    board_affiliation: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    phone: '',
    email: '',
    website: '',
    receipt_footer: '',
    default_payment_window_days: 30,
  });

  const [initialForm, setInitialForm] = useState({ ...form });

  useEffect(() => {
    fetchConfiguration();
    fetchAuditLogs();
  }, []);

  const fetchConfiguration = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/fees/configuration');
      const config: ConfigurationData = res.data.data;
      setData(config);

      const mappedForm = {
        board_affiliation: config.organization.board_affiliation || '',
        address: config.organization.address || '',
        city: config.organization.city || '',
        state: config.organization.state || '',
        postal_code: config.organization.postal_code || '',
        phone: config.organization.phone || '',
        email: config.organization.email || '',
        website: config.organization.website || '',
        receipt_footer: config.receipts.footer_note || '',
        default_payment_window_days: config.demands.default_payment_window_days || 30,
      };

      setForm(mappedForm);
      setInitialForm(mappedForm);
    } catch (err: any) {
      console.error('Failed to load finance configuration', err);
      toast.error(err.response?.data?.message || 'Failed to load finance configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await apiClient.get('/fees/configuration/audit');
      if (res.data?.data) {
        setAuditLogs(res.data.data);
      }
    } catch {
      // Audit endpoint optional fallback
    }
  };

  const isDirty = useMemo(() => {
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  }, [form, initialForm]);

  const handleReset = () => {
    setForm({ ...initialForm });
    toast.info('Form reset to saved configuration.');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (form.phone && (form.phone.length < 5 || form.phone.length > 20)) {
      toast.error('Phone number must be between 5 and 20 characters.');
      return;
    }

    const windowDays = Number(form.default_payment_window_days);
    if (isNaN(windowDays) || windowDays < 1 || windowDays > 365) {
      toast.error('Payment window must be between 1 and 365 days.');
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.patch('/fees/configuration', {
        board_affiliation: form.board_affiliation,
        address: form.address,
        city: form.city,
        state: form.state,
        postal_code: form.postal_code,
        phone: form.phone,
        email: form.email,
        website: form.website,
        receipt_footer: form.receipt_footer,
        default_payment_window_days: windowDays,
      });

      toast.success(res.data?.message || 'Finance configuration saved successfully.');
      if (res.data?.data) {
        setData(res.data.data);
        const updated = {
          board_affiliation: res.data.data.organization.board_affiliation || '',
          address: res.data.data.organization.address || '',
          city: res.data.data.organization.city || '',
          state: res.data.data.organization.state || '',
          postal_code: res.data.data.organization.postal_code || '',
          phone: res.data.data.organization.phone || '',
          email: res.data.data.organization.email || '',
          website: res.data.data.organization.website || '',
          receipt_footer: res.data.data.receipts.footer_note || '',
          default_payment_window_days:
            res.data.data.demands.default_payment_window_days || 30,
        };
        setForm(updated);
        setInitialForm(updated);
      }
      fetchAuditLogs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestGateway = async () => {
    setTestingGateway(true);
    setTestResult(null);
    try {
      const res = await apiClient.post('/fees/configuration/razorpay/test');
      setTestResult({
        status: res.data.status,
        message: res.data.message,
        timestamp: res.data.timestamp || new Date().toISOString(),
      });
      if (res.data.success) {
        toast.success(res.data.message);
      } else {
        toast.warning(res.data.message);
      }
      // Re-read status to refresh last validation timestamp
      const statusRes = await apiClient.get('/fees/configuration/razorpay/status');
      if (data && statusRes.data?.data) {
        setData({ ...data, gateway: statusRes.data.data });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gateway probe failed.';
      setTestResult({
        status: 'FAILED',
        message: msg,
        timestamp: new Date().toISOString(),
      });
      toast.error(msg);
    } finally {
      setTestingGateway(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-10 space-y-8 animate-pulse max-w-7xl mx-auto">
        <div className="h-10 w-72 bg-slate-200 dark:bg-white/10 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-28 bg-slate-200 dark:bg-white/10 rounded-2xl" />
            ))}
        </div>
        <div className="h-96 bg-slate-200 dark:bg-white/10 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold">Failed to load configuration</h2>
        <p className="text-sm text-slate-500">
          The server did not return valid finance configuration parameters.
        </p>
        <button
          onClick={fetchConfiguration}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto text-slate-800 dark:text-slate-100">
      {/* ── Breadcrumb & Header ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <span>Workspace</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Finance & Fees</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-emerald-600 dark:text-emerald-400">Configuration</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
                  Finance Configuration
                  {isDirty && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold animate-pulse">
                      Unsaved Changes
                    </span>
                  )}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Manage organization billing parameters, payment methods, receipts, and Razorpay gateway prerequisites.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchConfiguration}
              disabled={loading || saving}
              className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-slate-600 dark:text-slate-300"
              title="Refresh configuration from server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || saving}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-emerald-500/20 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Context & Status Highlights ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tenant Organization */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tenant Scope</p>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
              {data.organization.org_name}
            </p>
            <p className="text-xs text-slate-500 font-mono">Code: {data.organization.org_code}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Academic Year Context */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Year</p>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">
              {data.academic_year?.name || 'Not Configured'}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium capitalize">
              Status: {data.academic_year?.status || 'None'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Currency & Accounting Standard */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Base Currency</p>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">
              {data.currency.code} ({data.currency.symbol})
            </p>
            <p className="text-xs text-slate-500">Schema Standardized</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Gateway Readiness */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gateway Status</p>
            <p className="text-base font-bold text-slate-800 dark:text-slate-100">
              {data.gateway.name}
            </p>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  data.gateway.status === 'CONFIGURED'
                    ? 'bg-emerald-500'
                    : data.gateway.status === 'PARTIALLY_CONFIGURED'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                }`}
              />
              <span className="text-xs font-semibold capitalize text-slate-600 dark:text-slate-300">
                {data.gateway.status === 'CONFIGURED'
                  ? `Ready (${data.gateway.environment_mode})`
                  : data.gateway.status === 'PARTIALLY_CONFIGURED'
                    ? 'Incomplete'
                    : 'Needs Setup'}
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-1 border-b border-border/80 overflow-x-auto pb-1 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'general'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          General & Organization
        </button>

        <button
          onClick={() => setActiveTab('currency')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'currency'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Currency & Receipts
        </button>

        <button
          onClick={() => setActiveTab('methods')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'methods'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Payment Methods ({data.payment_methods.length})
        </button>

        <button
          onClick={() => setActiveTab('gateway')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'gateway'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Razorpay Gateway
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          Audit & History
        </button>

        <button
          onClick={() => setActiveTab('limitations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'limitations'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-b-2 border-emerald-500'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Info className="w-4 h-4" />
          Schema Disclosure
        </button>
      </div>

      {/* ── TAB 1: General & Organization Context ── */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold">Organization & Billing Identity</h2>
              <p className="text-xs text-slate-500 mt-1">
                Editable contact details are saved to the verified organization tenant profile. Primary IDs and codes are strictly read-only.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> Organization Legal Name
                </label>
                <input
                  disabled
                  value={data.organization.org_name}
                  className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> Institutional Code
                </label>
                <input
                  disabled
                  value={data.organization.org_code}
                  className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Board Affiliation (e.g., CBSE / ICSE / IB)
                </label>
                <input
                  value={form.board_affiliation}
                  onChange={(e) => setForm({ ...form, board_affiliation: e.target.value })}
                  placeholder="e.g. CBSE / State Board"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Finance Contact Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="accounts@school.edu"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Billing Phone Number *
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Official Website
                </label>
                <input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://myschool.edu"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Official Billing Address
                </label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Campus address line"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  City
                </label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  State / Postal Code
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="State"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  />
                  <input
                    value={form.postal_code}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                    placeholder="PIN Code"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Academic Year Context Card */}
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  Active Academic Year Context
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Resolved automatically via organization-aware logic from the Academic Management module.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 font-semibold text-slate-600 dark:text-slate-300">
                Read-Only in Finance
              </span>
            </div>

            {data.academic_year ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">Academic Session</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {data.academic_year.name}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">Session Status</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                    {data.academic_year.status}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">Date Span</span>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    {data.academic_year.start_date} to {data.academic_year.end_date}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                No active academic year registered for this organization. Configure an academic year in Academic Management.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: Currency & Receipts ── */}
      {activeTab === 'currency' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                Currency & Monetary Presentation
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Currency formatting is standard across all student fee ledgers, demands, and receipts.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono text-lg">
                    {data.currency.symbol}
                  </span>
                  Indian Rupee ({data.currency.code})
                </p>
                <p className="text-xs text-slate-500">{data.currency.note}</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-semibold">
                Fixed Base Currency
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                Receipt & Demand Numbering Conventions
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sequential document counters enforce audit integrity per the finalized database contract.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">Payment Receipt Numbering</span>
                  <span className="text-xs text-slate-500 font-mono">Sequential Strategy</span>
                </div>
                <p className="text-base font-mono font-bold text-slate-800 dark:text-slate-100">
                  {data.receipts.format}
                </p>
                <p className="text-xs text-slate-500">{data.receipts.note}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">Fee Demand Numbering</span>
                  <span className="text-xs text-slate-500 font-mono">Sequential Strategy</span>
                </div>
                <p className="text-base font-mono font-bold text-slate-800 dark:text-slate-100">
                  {data.demands.format}
                </p>
                <p className="text-xs text-slate-500">
                  Document sequence counter managed by DocumentNumberService.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Default Payment Due Window (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.default_payment_window_days}
                  onChange={(e) =>
                    setForm({ ...form, default_payment_window_days: parseInt(e.target.value) || 30 })
                  }
                  className="w-full max-w-xs px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-mono"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Default number of calendar days between demand creation and due date.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Receipt Footer Disclaimer Note
                </label>
                <textarea
                  rows={3}
                  value={form.receipt_footer}
                  onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })}
                  placeholder="Thank you for your payment. Please retain this receipt for tax and fee ledger reconciliation."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Payment Methods Matrix ── */}
      {activeTab === 'methods' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                Supported Payment Methods
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Methods defined by the finalized database payment_method enum and operational cashier workflow.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Enum Code</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data.payment_methods.map((method) => (
                    <tr key={method.code} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                        {method.label}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 font-mono text-slate-600 dark:text-slate-300 capitalize">
                          {method.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        {method.code}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${
                            method.status === 'configured'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {method.status === 'configured' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          {method.status === 'configured' ? 'Configured' : 'Requires Gateway'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">{method.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Razorpay Gateway ── */}
      {activeTab === 'gateway' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  Razorpay Gateway Configuration Status
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Server-side environment configuration status. In accordance with PCI-DSS security guidelines, credentials are never exposed through API responses.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/app/finance/checkout')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 rounded-xl text-xs font-bold transition-all"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Test Standard Checkout
                </button>
                <button
                  type="button"
                  onClick={handleTestGateway}
                  disabled={testingGateway}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingGateway ? 'animate-spin' : ''}`} />
                  {testingGateway ? 'Testing Connection...' : 'Test Gateway Connection'}
                </button>
              </div>
            </div>

            {/* Test result feedback banner */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  testResult.status === 'SUCCESS'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                }`}
              >
                {testResult.status === 'SUCCESS' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="text-sm font-bold">
                    {testResult.status === 'SUCCESS'
                      ? 'Gateway Connectivity Verified'
                      : 'Gateway Validation Alert'}
                  </p>
                  <p className="text-xs">{testResult.message}</p>
                  <p className="text-[10px] opacity-75 font-mono">
                    Validated at: {testResult.timestamp}
                  </p>
                </div>
              </div>
            )}

            {/* Security checklist grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Key ID presence */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">RAZORPAY_KEY_ID</span>
                  {data.gateway.key_id_configured ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Configured
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold inline-flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Missing
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Public merchant identifier configured in server environment.
                </p>
              </div>

              {/* Key Secret presence */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">RAZORPAY_KEY_SECRET</span>
                  {data.gateway.key_secret_configured ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Configured
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold inline-flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Missing
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  API signing secret stored exclusively on server. Never exposed to browser.
                </p>
              </div>

              {/* Webhook Secret presence */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">WEBHOOK_SECRET</span>
                  {data.gateway.webhook_secret_configured ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Configured
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold inline-flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Optional
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Secret for validating asynchronous payment webhooks from Razorpay.
                </p>
              </div>
            </div>

            {/* Environment instructions */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" /> Server-Side Environment Setup Instructions
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {data.gateway.setup_instructions}
              </p>
              <div className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
                # Sample .env configuration (Backend Server)<br />
                RAZORPAY_KEY_ID=rzp_test_YourKeyHere<br />
                RAZORPAY_KEY_SECRET=YourSecretHere<br />
                RAZORPAY_WEBHOOK_SECRET=YourWebhookSecretHere
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: Audit & History ── */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-500" />
                Configuration Audit History
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Immutable audit trail of configuration updates and gateway validation events for this organization.
              </p>
            </div>

            {auditLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border/80 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Operator</th>
                      <th className="py-3 px-4">Changed Properties</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                          {new Date(log.created_at).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-xs font-mono">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-600 dark:text-slate-300">
                          {log.performed_by || 'system'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {log.details?.changed_fields
                            ? log.details.changed_fields.join(', ')
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No recorded configuration change events found in the audit trail.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 6: Schema Disclosure ── */}
      {activeTab === 'limitations' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                Finalized Database Constraints & Capability Disclosure
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Transparent disclosure of supported features versus immutable database constraints (Rule 1.1).
              </p>
            </div>

            <div className="space-y-3">
              {data.schema_limitations.map((limitation, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{limitation}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceConfigurationPage;
