import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart2,
  Calendar,
  Clock,
  Download,
  RefreshCw,
  Coins,
  Percent,
  Sliders,
  ShieldCheck,
  FileSpreadsheet,
  ChevronRight,
  AlertTriangle,
  Building2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { apiClient } from '../../../lib/api-client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================
type PlanningTab =
  | 'overview'
  | 'collections_forecast'
  | 'receivables_forecast'
  | 'scenario_planner'
  | 'academic_outlook'
  | 'concession_sensitivity'
  | 'data_quality'
  | 'exports';

interface MetricItem {
  amount: number;
  currency: string;
  type: 'ACTUAL' | 'OPERATIONAL_BALANCE' | 'SCHEDULED_OBLIGATION' | 'FORECAST' | 'HYPOTHETICAL';
  description: string;
  source_table: string;
}

interface PlanningOverviewData {
  currency: string;
  planning_horizon_months: number;
  metrics: {
    historical_successful_collections: MetricItem;
    current_outstanding_receivables: MetricItem;
    current_overdue_receivables: MetricItem;
    scheduled_dues_in_horizon: MetricItem;
    projected_collections: MetricItem;
    projected_remaining_receivables: MetricItem;
  };
  assumptions: {
    realization_rate_pct: number;
    start_date: string;
    is_simulation: boolean;
  };
  data_quality_status: 'SUFFICIENT_HISTORICAL_DATA' | 'LIMITED_HISTORICAL_DATA' | 'ASSUMPTION_DRIVEN';
  durable_budget_persistence: boolean;
  timestamp: string;
}

interface MonthlyProjectionItem {
  month_year: string;
  year: number;
  month: number;
  dues_count: number;
  student_count: number;
  scheduled_amount_due: number;
  already_allocated_amount: number;
  remaining_scheduled_due: number;
  projected_collections: number;
  projected_remaining_due: number;
}

interface CollectionsForecastData {
  currency: string;
  horizon_months: number;
  summary: {
    total_scheduled_dues: number;
    total_already_allocated: number;
    total_remaining_scheduled: number;
    total_projected_collections: number;
    total_projected_remaining_dues: number;
  };
  assumptions: {
    realization_rate_pct: number;
    monthly_adjustment: number;
    start_date: string;
  };
  monthly_projections: MonthlyProjectionItem[];
  historical_comparison: {
    months_analyzed: number;
    historical_total_collected: number;
    monthly_history: Array<{
      month_year: string;
      year: number;
      month: number;
      transaction_count: number;
      total_collected: number;
    }>;
  };
  data_quality: {
    status: 'SUFFICIENT_HISTORICAL_DATA' | 'LIMITED_HISTORICAL_DATA' | 'ASSUMPTION_DRIVEN';
    warning: string | null;
  };
}

interface ReceivablesForecastData {
  currency: string;
  horizon_months: number;
  current_receivables: {
    total_outstanding: number;
    overdue_balance: number;
    current_pending: number;
    aging_buckets: {
      current: number;
      overdue_1_30: number;
      overdue_31_60: number;
      overdue_61_90: number;
      overdue_90_plus: number;
    };
  };
  projected_receivables: {
    horizon_scheduled_due: number;
    assumed_realization_rate_pct: number;
    projected_collections_from_dues: number;
    projected_ending_outstanding: number;
  };
}

interface ScenarioDetail {
  label: string;
  assumed_realization_rate_pct: number;
  total_projected_collections: number;
  projected_ending_receivables: number;
  monthly_breakdown: Array<{
    month_year: string;
    scheduled_due: number;
    projected_collections: number;
    projected_remaining_due: number;
  }>;
  variance_from_baseline: {
    delta_amount: number;
    delta_pct: number;
  };
}

interface ScenarioData {
  currency: string;
  horizon_months: number;
  baseline_scheduled_dues: number;
  current_outstanding_receivables: number;
  scenarios: {
    conservative: ScenarioDetail;
    expected: ScenarioDetail;
    optimistic: ScenarioDetail;
  };
  data_limitations: string;
  calculated_at: string;
}

interface AcademicYearOutlookItem {
  academic_year_id: string;
  academic_year_name: string;
  start_date: string;
  end_date: string;
  status: string;
  charges_count: number;
  student_count: number;
  assessed_amount: number;
  scheduled_dues_amount: number;
  collected_amount: number;
  outstanding_amount: number;
  realization_rate_pct: number;
}

interface ConcessionSensitivityData {
  currency: string;
  simulation_type: string;
  current_baseline: {
    total_assessed_fee_base: number;
    students_with_concessions_count: number;
    concession_records_count: number;
    weighted_avg_concession_pct: number;
  };
  hypothetical_shift: {
    delta_pct: number;
    assumed_collection_realization_pct: number;
  };
  impact_estimates: {
    estimated_concession_change_amount: number;
    estimated_net_scheduled_dues_change: number;
    estimated_cash_collection_change: number;
  };
  concessions_by_type: Array<{
    scholarship_type: string;
    status: string;
    count: number;
    avg_percentage: number;
    min_percentage: number;
    max_percentage: number;
  }>;
  governance_notice: string;
}

interface DataQualityData {
  data_density_status: 'SUFFICIENT_HISTORICAL_DATA' | 'LIMITED_HISTORICAL_DATA' | 'ASSUMPTION_DRIVEN';
  historical_forecast_accuracy_available: boolean;
  accuracy_unavailable_reason: string;
  historical_metrics: {
    distinct_transaction_months: number;
    total_successful_transactions: number;
  };
  operational_integrity_checks: {
    null_due_dates_count: number;
    distinct_currencies: string[];
    multi_currency_detected: boolean;
    captured_unallocated_transactions_count: number;
    captured_unallocated_amount: number;
  };
  disclosures: string[];
}

export const FinancePlanning: React.FC = () => {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<PlanningTab>('overview');

  // Shared Config / Horizons
  const [horizonMonths, setHorizonMonths] = useState<number>(6);
  const [realizationRate, setRealizationRate] = useState<number>(85);
  const [monthlyAdjustment] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Scenario Specific Inputs
  const [conservativeRate, setConservativeRate] = useState<number>(70);
  const [expectedRate, setExpectedRate] = useState<number>(85);
  const [optimisticRate, setOptimisticRate] = useState<number>(95);

  // Concession Sensitivity Specific Inputs
  const [hypotheticalDeltaPct, setHypotheticalDeltaPct] = useState<number>(5);

  // Data States
  const [overview, setOverview] = useState<PlanningOverviewData | null>(null);
  const [collectionsForecast, setCollectionsForecast] = useState<CollectionsForecastData | null>(null);
  const [receivablesForecast, setReceivablesForecast] = useState<ReceivablesForecastData | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioData | null>(null);
  const [academicOutlook, setAcademicOutlook] = useState<{ academic_years: AcademicYearOutlookItem[] } | null>(null);
  const [concessionSensitivity, setConcessionSensitivity] = useState<ConcessionSensitivityData | null>(null);
  const [dataQuality, setDataQuality] = useState<DataQualityData | null>(null);

  // Currency formatter
  const formatMoney = (val: number | undefined | null) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper for Badge Colors
  const getClassificationBadge = (type: string) => {
    switch (type) {
      case 'ACTUAL':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Historical Actual'
        };
      case 'OPERATIONAL_BALANCE':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          label: 'Current Operational'
        };
      case 'SCHEDULED_OBLIGATION':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
          label: 'Scheduled Dues'
        };
      case 'FORECAST':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Deterministic Forecast'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          label: 'Simulation Assumption'
        };
    }
  };

  // Helper for Data Density Status
  const getDensityBadge = (status?: string) => {
    switch (status) {
      case 'SUFFICIENT_HISTORICAL_DATA':
        return {
          label: 'Sufficient Historical Data (6+ Months)',
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
        };
      case 'LIMITED_HISTORICAL_DATA':
        return {
          label: 'Limited Historical Data (2-5 Months)',
          color: 'text-amber-700 bg-amber-50 border-amber-200'
        };
      default:
        return {
          label: 'Assumption-Driven Projection (<2 Months)',
          color: 'text-rose-700 bg-rose-50 border-rose-200'
        };
    }
  };

  // Fetch Overview
  const fetchOverview = async () => {
    try {
      const res = await apiClient.get(
        `/fees/planning/overview?horizonMonths=${horizonMonths}&realizationRate=${realizationRate}`
      );
      if (res.data?.success) {
        setOverview(res.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching planning overview:', err);
      toast.error('Failed to load financial planning overview');
    }
  };

  // Fetch Collections Forecast
  const fetchCollectionsForecast = async () => {
    try {
      const res = await apiClient.get(
        `/fees/planning/collections-forecast?horizonMonths=${horizonMonths}&realizationRate=${realizationRate}&monthlyAdjustment=${monthlyAdjustment}`
      );
      if (res.data?.success) {
        setCollectionsForecast(res.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching collections forecast:', err);
      toast.error('Failed to load collections forecast');
    }
  };

  // Fetch Receivables Forecast
  const fetchReceivablesForecast = async () => {
    try {
      const res = await apiClient.get(
        `/fees/planning/receivables-forecast?horizonMonths=${horizonMonths}&realizationRate=${realizationRate}`
      );
      if (res.data?.success) {
        setReceivablesForecast(res.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching receivables forecast:', err);
      toast.error('Failed to load receivables forecast');
    }
  };

  // Fetch Scenarios
  const fetchScenarios = async () => {
    try {
      const res = await apiClient.post('/fees/planning/scenario', {
        horizonMonths,
        conservativeRate,
        expectedRate,
        optimisticRate,
        monthlyAdjustment
      });
      if (res.data?.success) {
        setScenarios(res.data.data);
      }
    } catch (err: any) {
      console.error('Error calculating scenarios:', err);
      toast.error('Failed to calculate planning scenarios');
    }
  };

  // Fetch Academic Outlook
  const fetchAcademicOutlook = async () => {
    try {
      const res = await apiClient.get(`/fees/planning/academic-year-outlook?realizationRate=${realizationRate}`);
      if (res.data?.success) {
        setAcademicOutlook(res.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching academic outlook:', err);
      toast.error('Failed to load academic year outlook');
    }
  };

  // Fetch Concession Sensitivity
  const fetchConcessionSensitivity = async () => {
    try {
      const res = await apiClient.post('/fees/planning/concession-sensitivity', {
        hypotheticalDeltaPct,
        realizationRatePct: realizationRate
      });
      if (res.data?.success) {
        setConcessionSensitivity(res.data.data);
      }
    } catch (err: any) {
      console.error('Error calculating concession sensitivity:', err);
      toast.error('Failed to calculate concession sensitivity');
    }
  };

  // Fetch Data Quality
  const fetchDataQuality = async () => {
    try {
      const res = await apiClient.get('/fees/planning/data-quality');
      if (res.data?.success) {
        setDataQuality(res.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching data quality:', err);
      toast.error('Failed to load planning data quality metrics');
    }
  };

  // Initial and reactive load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchOverview(),
        fetchCollectionsForecast(),
        fetchReceivablesForecast(),
        fetchScenarios(),
        fetchAcademicOutlook(),
        fetchConcessionSensitivity(),
        fetchDataQuality()
      ]);
      setLoading(false);
    };
    loadData();
  }, [horizonMonths, realizationRate]);

  // Export CSV Handler
  const handleExportCSV = async (exportType: 'collections_forecast' | 'scenario_planner' | 'academic_year_outlook') => {
    try {
      toast.info(`Preparing ${exportType.replace(/_/g, ' ')} CSV export...`);
      const url = `/api/fees/planning/export?exportType=${exportType}&horizonMonths=${horizonMonths}&realizationRate=${realizationRate}&conservativeRate=${conservativeRate}&expectedRate=${expectedRate}&optimisticRate=${optimisticRate}`;
      window.open(url, '_blank');
      toast.success('Planning export generated successfully');
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('Failed to export CSV');
    }
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
                  <TrendingUp className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-bold text-slate-900">Financial Budgeting & Forecasting</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Read-Only Simulation Workspace
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Deterministic scenario planning, collections forecasting & receivables modeling derived strictly from authoritative ERP records.
              </p>
            </div>

            {/* Horizon & Refresh Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <span className="text-xs font-medium text-slate-600 px-2 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Horizon:
                </span>
                {[3, 6, 12].map((h) => (
                  <button
                    key={h}
                    onClick={() => setHorizonMonths(h)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      horizonMonths === h
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {h}M
                  </button>
                ))}
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <span className="text-xs font-medium text-slate-600 px-2 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" /> Realization:
                </span>
                <select
                  value={realizationRate}
                  onChange={(e) => setRealizationRate(Number(e.target.value))}
                  className="bg-white text-xs font-semibold text-slate-800 rounded-md px-2 py-1 border border-slate-200 focus:outline-none"
                >
                  <option value={70}>70% (Conservative)</option>
                  <option value={80}>80% (Prudent)</option>
                  <option value={85}>85% (Expected Base)</option>
                  <option value={90}>90% (High Target)</option>
                  <option value={95}>95% (Optimistic)</option>
                  <option value={100}>100% (Ceiling)</option>
                </select>
              </div>

              <button
                onClick={() => {
                  fetchOverview();
                  fetchCollectionsForecast();
                  fetchReceivablesForecast();
                  fetchScenarios();
                  toast.success('Workspace refreshed with latest operational data');
                }}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                title="Refresh Workspace"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Schema Freeze & Non-Durable Notice */}
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-md flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Schema Freeze Enforced:</strong> Institutional budgets and forecasts are unpersisted mathematical scenario models. No database mutations or artificial journal entries are generated.
              </span>
            </div>
            {dataQuality && (
              <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getDensityBadge(dataQuality.data_density_status).color}`}>
                {getDensityBadge(dataQuality.data_density_status).label}
              </span>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-4 border-b border-slate-200 overflow-x-auto scrollbar-none">
            {[
              { id: 'overview', label: 'Executive Overview', icon: BarChart2 },
              { id: 'collections_forecast', label: 'Collections Forecast', icon: Coins },
              { id: 'receivables_forecast', label: 'Receivables Horizon', icon: Clock },
              { id: 'scenario_planner', label: 'Scenario Planner', icon: Sliders },
              { id: 'academic_outlook', label: 'Academic-Year Outlook', icon: Building2 },
              { id: 'concession_sensitivity', label: 'Concession Sensitivity', icon: Percent },
              { id: 'data_quality', label: 'Data Quality & Governance', icon: ShieldCheck },
              { id: 'exports', label: 'Planning Exports', icon: FileSpreadsheet },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as PlanningTab)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────── */}
      {/* MAIN WORKSPACE BODY */}
      {/* ───────────────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500 mt-3">Evaluating financial planning parameters...</p>
          </div>
        ) : (
          <>
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SCREEN A: EXECUTIVE OVERVIEW */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'overview' && overview && (
              <div className="space-y-6">
                {/* Metric Cards Grid with Distinct Labeling */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(overview.metrics).map(([key, metric]) => {
                    const badge = getClassificationBadge(metric.type);
                    return (
                      <div
                        key={key}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-shadow"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {metric.source_table}
                            </span>
                          </div>
                          <h3 className="text-sm font-medium text-slate-600 capitalize">
                            {key.replace(/_/g, ' ')}
                          </h3>
                          <div className="text-2xl font-bold text-slate-900 mt-2">
                            {formatMoney(metric.amount)}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                          {metric.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Horizon Comparison Card */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        Planning Outlook ({overview.planning_horizon_months} Months)
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Expected collections under {overview.assumptions.realization_rate_pct}% realization assumption
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-indigo-600" />
                        <span className="text-slate-600 font-medium">Scheduled Obligations</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-emerald-500" />
                        <span className="text-slate-600 font-medium">Projected Collections</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
                    <div className="lg:col-span-2 h-72">
                      {collectionsForecast && collectionsForecast.monthly_projections.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={collectionsForecast.monthly_projections} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month_year" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 11 }} />
                            <YAxis tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                            <Tooltip
                              formatter={(v: any) => [formatMoney(v), '']}
                              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                            />
                            <Bar dataKey="remaining_scheduled_due" name="Scheduled Due" fill="#818cf8" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="projected_collections" name="Projected Collection" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400">
                          No scheduled dues recorded in the selected planning horizon.
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 flex flex-col justify-between text-xs space-y-4">
                      <div>
                        <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] mb-3">
                          Forecast Rule Formulation
                        </h4>
                        <div className="space-y-2 text-slate-600">
                          <p>
                            <strong>Formula:</strong> <code>Projected = Eligible Scheduled Dues × Realization Rate ({overview.assumptions.realization_rate_pct}%)</code>
                          </p>
                          <p>
                            <strong>Scheduled Dues Horizon:</strong> {formatMoney(overview.metrics.scheduled_dues_in_horizon.amount)}
                          </p>
                          <p>
                            <strong>Projected Realization:</strong> {formatMoney(overview.metrics.projected_collections.amount)}
                          </p>
                          <p>
                            <strong>Projected Uncollected:</strong> {formatMoney(overview.metrics.projected_remaining_receivables.amount)}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded border border-slate-200 text-slate-500 text-[11px] space-y-1">
                        <div className="font-semibold text-slate-700">Governance & Disclosure</div>
                        <div>• Projections are deterministic formulas, not machine learning or AI models.</div>
                        <div>• Pending and failed transactions are completely excluded from actual collections.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SCREEN B: COLLECTIONS FORECAST */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'collections_forecast' && collectionsForecast && (
              <div className="space-y-6">
                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs text-slate-500 font-medium">Scheduled Dues in Horizon</span>
                    <div className="text-xl font-bold text-slate-900 mt-1">
                      {formatMoney(collectionsForecast.summary.total_remaining_scheduled)}
                    </div>
                    <span className="text-[11px] text-purple-600 font-medium">Net remaining eligible dues</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs text-slate-500 font-medium">Projected Collections</span>
                    <div className="text-xl font-bold text-emerald-600 mt-1">
                      {formatMoney(collectionsForecast.summary.total_projected_collections)}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">At {collectionsForecast.assumptions.realization_rate_pct}% realization rate</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs text-slate-500 font-medium">Projected Uncollected Balance</span>
                    <div className="text-xl font-bold text-amber-600 mt-1">
                      {formatMoney(collectionsForecast.summary.total_projected_remaining_dues)}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Unrecovered scheduled balance</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs text-slate-500 font-medium">Historical Baseline Examined</span>
                    <div className="text-xl font-bold text-slate-900 mt-1">
                      {formatMoney(collectionsForecast.historical_comparison.historical_total_collected)}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Across {collectionsForecast.historical_comparison.months_analyzed} previous months</span>
                  </div>
                </div>

                {/* Monthly Projections Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Monthly Collections Schedule</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Month-by-month projection derived from student fee obligation due dates</p>
                    </div>
                    <button
                      onClick={() => handleExportCSV('collections_forecast')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      Export CSV
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4">Period (Month-Year)</th>
                          <th className="py-3 px-4">Dues Count</th>
                          <th className="py-3 px-4">Students</th>
                          <th className="py-3 px-4 text-right">Scheduled Due Amount</th>
                          <th className="py-3 px-4 text-right">Already Allocated</th>
                          <th className="py-3 px-4 text-right">Remaining Scheduled</th>
                          <th className="py-3 px-4 text-right text-emerald-700 bg-emerald-50/50">Projected Collections</th>
                          <th className="py-3 px-4 text-right text-amber-700 bg-amber-50/50">Projected Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {collectionsForecast.monthly_projections.length > 0 ? (
                          collectionsForecast.monthly_projections.map((m, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4 font-semibold text-slate-800">{m.month_year}</td>
                              <td className="py-3 px-4 text-slate-600">{m.dues_count}</td>
                              <td className="py-3 px-4 text-slate-600">{m.student_count}</td>
                              <td className="py-3 px-4 text-right font-mono text-slate-700">{formatMoney(m.scheduled_amount_due)}</td>
                              <td className="py-3 px-4 text-right font-mono text-slate-500">{formatMoney(m.already_allocated_amount)}</td>
                              <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">{formatMoney(m.remaining_scheduled_due)}</td>
                              <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600 bg-emerald-50/30">
                                {formatMoney(m.projected_collections)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-medium text-amber-700 bg-amber-50/30">
                                {formatMoney(m.projected_remaining_due)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400">
                              No monthly scheduled obligations recorded in this horizon.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SCREEN C: RECEIVABLES FORECAST */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'receivables_forecast' && receivablesForecast && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Receivables State */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          Current Operational Balances
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-2">
                          Outstanding Receivables: {formatMoney(receivablesForecast.current_receivables.total_outstanding)}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-rose-600 font-semibold">Overdue Balance</span>
                        <div className="text-sm font-bold text-rose-700">
                          {formatMoney(receivablesForecast.current_receivables.overdue_balance)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Current Aging Breakdown</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 block text-[11px]">Current Dues</span>
                          <span className="font-semibold text-slate-800">{formatMoney(receivablesForecast.current_receivables.aging_buckets.current)}</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 block text-[11px]">1–30 Days Overdue</span>
                          <span className="font-semibold text-slate-800">{formatMoney(receivablesForecast.current_receivables.aging_buckets.overdue_1_30)}</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 block text-[11px]">31–60 Days Overdue</span>
                          <span className="font-semibold text-slate-800">{formatMoney(receivablesForecast.current_receivables.aging_buckets.overdue_31_60)}</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 block text-[11px]">61–90 Days Overdue</span>
                          <span className="font-semibold text-slate-800">{formatMoney(receivablesForecast.current_receivables.aging_buckets.overdue_61_90)}</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                          <span className="text-slate-500 block text-[11px]">90+ Days Overdue</span>
                          <span className="font-semibold text-slate-800">{formatMoney(receivablesForecast.current_receivables.aging_buckets.overdue_90_plus)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Projected Recovery & Ending Balance */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Horizon Projection ({receivablesForecast.horizon_months}M)
                        </span>
                        <span className="text-xs font-semibold text-indigo-700">
                          Assumed Rate: {receivablesForecast.projected_receivables.assumed_realization_rate_pct}%
                        </span>
                      </div>

                      <div className="mt-4 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div>
                            <span className="text-xs text-slate-500 block">Horizon Scheduled Dues</span>
                            <span className="text-base font-bold text-slate-800">
                              {formatMoney(receivablesForecast.projected_receivables.horizon_scheduled_due)}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                          <div>
                            <span className="text-xs text-slate-500 block">Projected Recovery</span>
                            <span className="text-base font-bold text-emerald-600">
                              {formatMoney(receivablesForecast.projected_receivables.projected_collections_from_dues)}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                          <div className="text-xs text-indigo-900 font-medium">Projected Ending Outstanding Receivables</div>
                          <div className="text-2xl font-black text-indigo-700 mt-1">
                            {formatMoney(receivablesForecast.projected_receivables.projected_ending_outstanding)}
                          </div>
                          <p className="text-[11px] text-indigo-600 mt-1">
                            Calculated as: <code>max(0, current_outstanding - projected_recovery)</code> without double-counting applied concessions.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3 mt-4">
                      Reuses established Phase 8 Receivables calculation rules.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SCREEN D: SCENARIO PLANNER */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'scenario_planner' && scenarios && (
              <div className="space-y-6">
                {/* Assumptions Controls Bar */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-indigo-600" />
                        Simulation Assumptions
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Adjust realization assumptions for Conservative, Expected, and Optimistic models
                      </p>
                    </div>
                    <button
                      onClick={fetchScenarios}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                    >
                      Recalculate Scenarios
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-xs">
                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span className="text-slate-600">Conservative Realization</span>
                        <span className="text-indigo-600 font-mono">{conservativeRate}%</span>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={85}
                        step={1}
                        value={conservativeRate}
                        onChange={(e) => setConservativeRate(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-400">Severe economic drag or collection headwinds</span>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span className="text-slate-600">Expected Base Realization</span>
                        <span className="text-indigo-600 font-mono">{expectedRate}%</span>
                      </div>
                      <input
                        type="range"
                        min={60}
                        max={95}
                        step={1}
                        value={expectedRate}
                        onChange={(e) => setExpectedRate(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-400">Historical norm / institutional baseline</span>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span className="text-slate-600">Optimistic Realization</span>
                        <span className="text-indigo-600 font-mono">{optimisticRate}%</span>
                      </div>
                      <input
                        type="range"
                        min={75}
                        max={100}
                        step={1}
                        value={optimisticRate}
                        onChange={(e) => setOptimisticRate(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-400">Accelerated follow-ups & zero fee disputes</span>
                    </div>
                  </div>
                </div>

                {/* 3 Scenarios Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Conservative Card */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-t-4 border-t-amber-500 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">Conservative Scenario</h4>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {scenarios.scenarios.conservative.assumed_realization_rate_pct}% Realization
                        </span>
                      </div>
                      <div className="mt-4">
                        <span className="text-xs text-slate-500 block">Projected Cash Receipts</span>
                        <div className="text-2xl font-black text-slate-900 mt-0.5">
                          {formatMoney(scenarios.scenarios.conservative.total_projected_collections)}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-500 block">Projected Ending Receivables</span>
                        <div className="text-lg font-bold text-amber-700">
                          {formatMoney(scenarios.scenarios.conservative.projected_ending_receivables)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-rose-600 font-medium">
                      <span>Variance vs Expected:</span>
                      <span>
                        {formatMoney(scenarios.scenarios.conservative.variance_from_baseline.delta_amount)} ({scenarios.scenarios.conservative.variance_from_baseline.delta_pct}%)
                      </span>
                    </div>
                  </div>

                  {/* Expected Card */}
                  <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5 border-t-4 border-t-indigo-600 flex flex-col justify-between ring-1 ring-indigo-50">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-indigo-900">Expected Base Scenario</h4>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {scenarios.scenarios.expected.assumed_realization_rate_pct}% Realization
                        </span>
                      </div>
                      <div className="mt-4">
                        <span className="text-xs text-slate-500 block">Projected Cash Receipts</span>
                        <div className="text-2xl font-black text-indigo-900 mt-0.5">
                          {formatMoney(scenarios.scenarios.expected.total_projected_collections)}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-500 block">Projected Ending Receivables</span>
                        <div className="text-lg font-bold text-indigo-700">
                          {formatMoney(scenarios.scenarios.expected.projected_ending_receivables)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span>Baseline Reference</span>
                      <span>±0.00 (0.0%)</span>
                    </div>
                  </div>

                  {/* Optimistic Card */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 border-t-4 border-t-emerald-500 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">Optimistic Scenario</h4>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {scenarios.scenarios.optimistic.assumed_realization_rate_pct}% Realization
                        </span>
                      </div>
                      <div className="mt-4">
                        <span className="text-xs text-slate-500 block">Projected Cash Receipts</span>
                        <div className="text-2xl font-black text-emerald-600 mt-0.5">
                          {formatMoney(scenarios.scenarios.optimistic.total_projected_collections)}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <span className="text-xs text-slate-500 block">Projected Ending Receivables</span>
                        <div className="text-lg font-bold text-emerald-700">
                          {formatMoney(scenarios.scenarios.optimistic.projected_ending_receivables)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-medium">
                      <span>Variance vs Expected:</span>
                      <span>
                        +{formatMoney(scenarios.scenarios.optimistic.variance_from_baseline.delta_amount)} (+{scenarios.scenarios.optimistic.variance_from_baseline.delta_pct}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-100 rounded-lg text-slate-600 text-xs flex items-center justify-between">
                  <span>{scenarios.data_limitations}</span>
                  <span className="text-[11px] font-mono text-slate-400">Calculated: {new Date(scenarios.calculated_at).toLocaleTimeString()}</span>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SCREEN E: ACADEMIC-YEAR FINANCIAL OUTLOOK */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'academic_outlook' && academicOutlook && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Academic-Year Obligation Summary</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Aggregation of total assessments, scheduled dues, and collected fees grouped by academic session
                      </p>
                    </div>
                    <button
                      onClick={() => handleExportCSV('academic_year_outlook')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      Export CSV
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-3 px-4">Academic Year</th>
                          <th className="py-3 px-4">Session Dates</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Assessed Charges</th>
                          <th className="py-3 px-4 text-right">Scheduled Net Dues</th>
                          <th className="py-3 px-4 text-right">Collected Amount</th>
                          <th className="py-3 px-4 text-right">Outstanding Balance</th>
                          <th className="py-3 px-4 text-right">Realization Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {academicOutlook.academic_years.length > 0 ? (
                          academicOutlook.academic_years.map((ay) => (
                            <tr key={ay.academic_year_id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4 font-semibold text-slate-900">{ay.academic_year_name}</td>
                              <td className="py-3 px-4 text-slate-500 text-[11px]">
                                {ay.start_date?.slice(0, 10)} to {ay.end_date?.slice(0, 10)}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                  ay.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {ay.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-mono text-slate-700">{formatMoney(ay.assessed_amount)}</td>
                              <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">{formatMoney(ay.scheduled_dues_amount)}</td>
                              <td className="py-3 px-4 text-right font-mono text-emerald-600 font-semibold">{formatMoney(ay.collected_amount)}</td>
                              <td className="py-3 px-4 text-right font-mono text-amber-700 font-semibold">{formatMoney(ay.outstanding_amount)}</td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-mono font-bold text-indigo-700">{ay.realization_rate_pct}%</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400">
                              No academic years registered for this organization.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SCREEN F: CONCESSION SENSITIVITY ANALYSIS */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'concession_sensitivity' && concessionSensitivity && (
              <div className="space-y-6">
                {/* Simulation Control Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <Percent className="w-4 h-4 text-indigo-600" />
                        Hypothetical Concession Policy Sensitivity
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Analytical simulation of expected revenue shift under altered scholarship/concession discounts
                      </p>
                    </div>
                    <button
                      onClick={fetchConcessionSensitivity}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                    >
                      Recalculate Impact
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-xs">
                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span className="text-slate-600">Hypothetical Concession Shift</span>
                        <span className="text-indigo-600 font-mono">
                          {hypotheticalDeltaPct > 0 ? `+${hypotheticalDeltaPct}%` : `${hypotheticalDeltaPct}%`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={-20}
                        max={20}
                        step={1}
                        value={hypotheticalDeltaPct}
                        onChange={(e) => setHypotheticalDeltaPct(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-400">Simulate expanding (+) or tightening (-) institutional aid discount</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-slate-600 text-[11px]">
                      <div><strong>Current Assessed Charge Base:</strong> {formatMoney(concessionSensitivity.current_baseline.total_assessed_fee_base)}</div>
                      <div><strong>Students with Concessions:</strong> {concessionSensitivity.current_baseline.students_with_concessions_count}</div>
                      <div><strong>Weighted Average Discount:</strong> {concessionSensitivity.current_baseline.weighted_avg_concession_pct}%</div>
                    </div>
                  </div>
                </div>

                {/* Impact Estimates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs text-slate-500 font-medium">Estimated Aid Change</span>
                    <div className={`text-xl font-bold mt-1 ${concessionSensitivity.impact_estimates.estimated_concession_change_amount >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatMoney(concessionSensitivity.impact_estimates.estimated_concession_change_amount)}
                    </div>
                    <span className="text-[11px] text-slate-400">Change in total scholarship discount value</span>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs text-slate-500 font-medium">Estimated Net Dues Shift</span>
                    <div className="text-xl font-bold text-slate-900 mt-1">
                      {formatMoney(concessionSensitivity.impact_estimates.estimated_net_scheduled_dues_change)}
                    </div>
                    <span className="text-[11px] text-slate-400">Shift in billed net payable student dues</span>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs text-slate-500 font-medium">Expected Cash Realization Impact</span>
                    <div className="text-xl font-bold text-indigo-700 mt-1">
                      {formatMoney(concessionSensitivity.impact_estimates.estimated_cash_collection_change)}
                    </div>
                    <span className="text-[11px] text-slate-400">At {concessionSensitivity.hypothetical_shift.assumed_collection_realization_pct}% collection realization</span>
                  </div>
                </div>

                {/* Concessions by Type */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-900">Active Concessions by Category</h3>
                  </div>
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Scholarship Category</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Award Count</th>
                        <th className="py-3 px-4 text-right">Avg Percentage</th>
                        <th className="py-3 px-4 text-right">Min %</th>
                        <th className="py-3 px-4 text-right">Max %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {concessionSensitivity.concessions_by_type.length > 0 ? (
                        concessionSensitivity.concessions_by_type.map((c, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-semibold text-slate-800 capitalize">{c.scholarship_type.replace(/_/g, ' ')}</td>
                            <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 font-semibold uppercase">{c.status}</span></td>
                            <td className="py-3 px-4 text-right">{c.count}</td>
                            <td className="py-3 px-4 text-right font-mono font-medium">{c.avg_percentage}%</td>
                            <td className="py-3 px-4 text-right font-mono text-slate-500">{c.min_percentage}%</td>
                            <td className="py-3 px-4 text-right font-mono text-slate-500">{c.max_percentage}%</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">No active scholarship concession records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-900 text-xs">
                  {concessionSensitivity.governance_notice}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SCREEN G: DATA QUALITY & GOVERNANCE */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'data_quality' && dataQuality && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Historical Forecast Accuracy & Integrity Audit</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Verification of physical database storage and tracking limits</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getDensityBadge(dataQuality.data_density_status).color}`}>
                      {getDensityBadge(dataQuality.data_density_status).label}
                    </span>
                  </div>

                  {/* Accuracy Status Notice */}
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900">
                      <h4 className="font-bold">Historical Forecast Accuracy Not Supported</h4>
                      <p className="mt-1">{dataQuality.accuracy_unavailable_reason}</p>
                      <p className="mt-1 text-[11px] text-amber-800">
                        In accordance with Stage-1 & Stage-4 non-negotiable governance, no retroactive accuracy percentages are fabricated.
                      </p>
                    </div>
                  </div>

                  {/* Operational Data Checks Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-500 block">Missing / Null Due Dates</span>
                      <div className="text-xl font-bold text-slate-800 mt-1">
                        {dataQuality.operational_integrity_checks.null_due_dates_count}
                      </div>
                      <span className="text-[11px] text-slate-400">Dues requiring due-date backfill</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-500 block">Multi-Currency Transactions</span>
                      <div className="text-xl font-bold text-slate-800 mt-1">
                        {dataQuality.operational_integrity_checks.distinct_currencies.join(', ') || 'INR'}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {dataQuality.operational_integrity_checks.multi_currency_detected ? 'Cross-currency conversion active' : 'Single base currency verified'}
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-xs text-slate-500 block">Captured Unallocated Funds</span>
                      <div className="text-xl font-bold text-slate-800 mt-1">
                        {formatMoney(dataQuality.operational_integrity_checks.captured_unallocated_amount)}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {dataQuality.operational_integrity_checks.captured_unallocated_transactions_count} unallocated successful payments
                      </span>
                    </div>
                  </div>

                  {/* Disclosures list */}
                  <div className="pt-2">
                    <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Model Disclosures & Boundaries</h4>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {dataQuality.disclosures.map((d, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SCREEN H: PLANNING EXPORTS */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {activeTab === 'exports' && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-base font-semibold text-slate-900 mb-1">Financial Planning CSV Exports</h3>
                  <p className="text-xs text-slate-500 mb-6">
                    Download sanitized spreadsheet reports. All formula injection prefixes (=, +, -, @) are sanitized with apostrophe escaping.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <Coins className="w-6 h-6 text-indigo-600 mb-2" />
                        <h4 className="text-sm font-bold text-slate-900">Collections Forecast</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Monthly projections, scheduled dues, student counts, and assumed realization rate.
                        </p>
                      </div>
                      <button
                        onClick={() => handleExportCSV('collections_forecast')}
                        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Collections CSV
                      </button>
                    </div>

                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <Sliders className="w-6 h-6 text-indigo-600 mb-2" />
                        <h4 className="text-sm font-bold text-slate-900">Scenario Planner Comparison</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Side-by-side Conservative, Expected, and Optimistic collection and receivables estimates.
                        </p>
                      </div>
                      <button
                        onClick={() => handleExportCSV('scenario_planner')}
                        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Scenarios CSV
                      </button>
                    </div>

                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                      <div>
                        <Building2 className="w-6 h-6 text-indigo-600 mb-2" />
                        <h4 className="text-sm font-bold text-slate-900">Academic-Year Outlook</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Session-level assessments, net dues, collections, and realization rate history.
                        </p>
                      </div>
                      <button
                        onClick={() => handleExportCSV('academic_year_outlook')}
                        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Academic Outlook CSV
                      </button>
                    </div>
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

export default FinancePlanning;
