import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../lib/api-client';
import {
  Coins,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Percent,
  Clock,
  AlertTriangle,
  Layers,
  Plus,
  Search,
  BarChart2,
  Receipt,
  PlusCircle,
  CreditCard,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import {
  DashboardPageHeader,
  DashboardKpiCard,
  DashboardSection,
  DashboardChartCard,
  DashboardErrorState,
  DashboardQuickActions,
  QuickActionItem,
} from '@/components/dashboard';
import { Button } from '@/components/ui/button';

const fmt = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export const FinanceDashboard = () => {
  const navigate = useNavigate();

  // Demand-driven queries with independent staleTime and caching
  const kpisQuery = useQuery({
    queryKey: ['finance', 'dashboard', 'kpis'],
    queryFn: async () => {
      const res = await apiClient.get('/fees/dashboard/kpis');
      return res.data || {};
    },
    staleTime: 60_000,
  });

  const trendQuery = useQuery({
    queryKey: ['finance', 'dashboard', 'trend'],
    queryFn: async () => {
      const res = await apiClient.get('/fees/dashboard/collection-trend');
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 120_000,
  });

  const modesQuery = useQuery({
    queryKey: ['finance', 'dashboard', 'modes'],
    queryFn: async () => {
      const res = await apiClient.get('/fees/dashboard/payment-modes');
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 120_000,
  });

  const byClassQuery = useQuery({
    queryKey: ['finance', 'dashboard', 'by-class'],
    queryFn: async () => {
      const res = await apiClient.get('/fees/dashboard/outstanding-by-class');
      const list = Array.isArray(res.data) ? res.data : [];
      return list.slice(0, 8);
    },
    staleTime: 120_000,
  });

  const isRefreshing =
    kpisQuery.isFetching ||
    trendQuery.isFetching ||
    modesQuery.isFetching ||
    byClassQuery.isFetching;

  const handleRefresh = () => {
    kpisQuery.refetch();
    trendQuery.refetch();
    modesQuery.refetch();
    byClassQuery.refetch();
  };

  const kpis = kpisQuery.data || {};
  const trend = trendQuery.data || [];
  const modes = modesQuery.data || [];
  const byClass = byClassQuery.data || [];

  const error = kpisQuery.error || trendQuery.error || modesQuery.error || byClassQuery.error;
  const errorMessage = error instanceof Error ? error.message : null;

  const quickActions: QuickActionItem[] = [
    {
      title: 'Fee Structure Manager',
      description: 'Configure grade-wise tuition, admission, and transport templates.',
      icon: Plus,
      to: '/app/finance/structures',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Demand Generation',
      description: 'Issue student billing invoices, term installments, and fee demands.',
      icon: PlusCircle,
      to: '/app/finance/demands',
      iconBg: 'bg-blue-50 dark:bg-blue-950/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Payment Entry Desk',
      description: 'Record counter payments, UPI receipts, cheques, and bank transfers.',
      icon: Coins,
      to: '/app/finance/payments',
      iconBg: 'bg-amber-50 dark:bg-amber-950/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Student Fee Ledger',
      description: 'Search accounts, view audit trails, balances, and concession records.',
      icon: Search,
      to: '/app/finance/ledger',
      iconBg: 'bg-purple-50 dark:bg-purple-950/50',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Financial Reports',
      description: 'Audit collection summaries, aging receivables, and reconciliation.',
      icon: BarChart2,
      to: '/app/finance/reports',
      iconBg: 'bg-rose-50 dark:bg-rose-950/50',
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
    {
      title: 'Receipts Repository',
      description: 'Download, print, or re-issue stamped receipts and settlement notes.',
      icon: Receipt,
      to: '/app/finance/receipts',
      iconBg: 'bg-sky-50 dark:bg-sky-950/50',
      iconColor: 'text-sky-600 dark:text-sky-400',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Page Header */}
      <DashboardPageHeader
        title="Finance & Fees Command Center"
        description="Institutional fee collection telemetry, outstanding balance aging, payment mode breakdown, and reconciliation ledger."
        badge={{
          text: 'Financial Governance',
          variant: 'success',
          icon: Coins,
        }}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm gap-2 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/app/finance/payments')}
              className="rounded-xl font-bold text-xs gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Coins className="w-3.5 h-3.5" />
              Collect Payment
            </Button>
          </div>
        }
      />

      {errorMessage && <DashboardErrorState message={errorMessage} onRetry={handleRefresh} />}

      {/* 2. Collection & Outstanding KPIs */}
      <DashboardSection
        title="Realization & Receivables Overview"
        description="Current session collections, overdue obligations, and receipt realization rate."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKpiCard
            title="Today's Collection"
            value={fmt(kpis.todayCollection ?? 0)}
            subtitle="Collections recorded today"
            icon={DollarSign}
            variant="success"
            loading={kpisQuery.isLoading}
          />
          <DashboardKpiCard
            title="This Month Collection"
            value={fmt(kpis.monthCollection ?? 0)}
            subtitle="Current calendar month"
            icon={TrendingUp}
            variant="primary"
            loading={kpisQuery.isLoading}
          />
          <DashboardKpiCard
            title="Collection Rate"
            value={`${kpis.collectionRate ?? 0}%`}
            subtitle="Of total billed demands"
            icon={Percent}
            variant="info"
            loading={kpisQuery.isLoading}
          />
          <DashboardKpiCard
            title="Total Outstanding"
            value={fmt(kpis.totalOutstanding ?? 0)}
            subtitle={`${kpis.pendingCount ?? 0} demands pending`}
            icon={AlertCircle}
            variant="warning"
            loading={kpisQuery.isLoading}
          />
          <DashboardKpiCard
            title="Overdue Fees"
            value={fmt(kpis.overdueAmount ?? 0)}
            subtitle="Past due payment date"
            icon={AlertTriangle}
            variant="danger"
            loading={kpisQuery.isLoading}
          />
          <DashboardKpiCard
            title="Pending Demands"
            value={String(kpis.pendingCount ?? 0)}
            subtitle="Unpaid student demands"
            icon={Clock}
            variant="warning"
            loading={kpisQuery.isLoading}
          />
          <DashboardKpiCard
            title="Receipts Today"
            value={String(kpis.transactionsCount ?? 0)}
            subtitle="Official vouchers generated"
            icon={Receipt}
            variant="purple"
            loading={kpisQuery.isLoading}
          />
          <DashboardKpiCard
            title="Fee Templates"
            value={String(kpis.activeStructuresCount ?? 0)}
            subtitle="Active billing structures"
            icon={Layers}
            variant="neutral"
            loading={kpisQuery.isLoading}
          />
        </div>
      </DashboardSection>

      {/* 3. Charts: 30-Day Trend & Payment Modes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <DashboardChartCard
            title="30-Day Fee Collection Velocity"
            subtitle="Daily realization timeline across cash, bank, and online channels"
            icon={TrendingUp}
            loading={trendQuery.isLoading}
            isEmpty={!trend.length}
            emptyTitle="No Trend Records"
            emptyMessage="No fee payments logged during the past 30 days."
            minHeight={260}
          >
            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.75rem',
                      color: 'hsl(var(--card-foreground))',
                      fontSize: '12px',
                    }}
                    formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Collection']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#trendGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DashboardChartCard>
        </div>

        <div className="lg:col-span-4">
          <DashboardChartCard
            title="Payment Modes"
            subtitle="Channel breakdown this month"
            icon={CreditCard}
            loading={modesQuery.isLoading}
            isEmpty={!modes.length}
            emptyTitle="No Payment Modes"
            emptyMessage="No payments recorded this month."
            minHeight={260}
          >
            <div className="h-60 w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modes}
                    dataKey="total"
                    nameKey="mode"
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {modes.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.75rem',
                      color: 'hsl(var(--card-foreground))',
                      fontSize: '12px',
                    }}
                    formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </DashboardChartCard>
        </div>
      </div>

      {/* 4. Chart Row 2: Outstanding by Class */}
      {byClass.length > 0 && (
        <DashboardChartCard
          title="Outstanding Demands by Class"
          subtitle="Collected vs unpaid receivables across academic grades"
          icon={BarChart2}
          loading={byClassQuery.isLoading}
          minHeight={240}
        >
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byClass}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: 'currentColor' }}
                  className="text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  dataKey="className"
                  type="category"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  className="text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.75rem',
                    color: 'hsl(var(--card-foreground))',
                    fontSize: '12px',
                  }}
                  formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`}
                />
                <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar
                  dataKey="outstanding"
                  name="Outstanding"
                  fill="#f59e0b"
                  radius={[0, 4, 4, 0]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardChartCard>
      )}

      {/* 5. Quick Actions Grid */}
      <DashboardSection
        title="Finance Operations Suite"
        description="Shortcuts for fee structure design, batch demands, ledger search, and receipts."
      >
        <DashboardQuickActions actions={quickActions} columns={3} />
      </DashboardSection>
    </div>
  );
};

export default FinanceDashboard;
