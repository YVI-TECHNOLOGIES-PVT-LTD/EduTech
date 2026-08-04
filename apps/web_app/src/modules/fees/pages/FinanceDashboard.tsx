import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../lib/api-client';
import {
    Coins, TrendingUp, AlertCircle, FileText, RefreshCw,
    DollarSign, Percent, Clock, AlertTriangle, Layers,
    Plus, Search, BarChart2, Receipt, PlusCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';

const fmt = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const GLASS = 'bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-sm';

interface KPI {
    label: string;
    value: string;
    sub?: string;
    icon: React.ElementType;
    color: string;
    bg: string;
}

export const FinanceDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState<any>({});
    const [trend, setTrend] = useState<any[]>([]);
    const [modes, setModes] = useState<any[]>([]);
    const [byClass, setByClass] = useState<any[]>([]);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [kpiRes, trendRes, modeRes, classRes] = await Promise.all([
                apiClient.get('/fees/dashboard/kpis'),
                apiClient.get('/fees/dashboard/collection-trend'),
                apiClient.get('/fees/dashboard/payment-modes'),
                apiClient.get('/fees/dashboard/outstanding-by-class'),
            ]);
            setKpis(kpiRes.data || {});
            setTrend(trendRes.data || []);
            setModes(modeRes.data || []);
            setByClass((classRes.data || []).slice(0, 8));
        } catch {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const kpiCards: KPI[] = [
        // Collections
        { label: "Today's Collection", value: fmt(kpis.todayCollection ?? 0), sub: 'vs yesterday', icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
        { label: 'This Month', value: fmt(kpis.monthCollection ?? 0), sub: 'current month', icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
        { label: 'Collection Rate', value: `${kpis.collectionRate ?? 0}%`, sub: 'of billed amount', icon: Percent, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/40' },
        // Outstanding
        { label: 'Outstanding', value: fmt(kpis.totalOutstanding ?? 0), sub: `${kpis.pendingCount ?? 0} demands`, icon: AlertCircle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40' },
        { label: 'Pending Demands', value: String(kpis.pendingCount ?? 0), sub: 'unpaid demands', icon: Clock, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40' },
        { label: 'Overdue Fees', value: fmt(kpis.overdueAmount ?? 0), sub: 'past due date', icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40' },
        // Operations
        { label: 'Receipts Today', value: String(kpis.transactionsCount ?? 0), sub: 'issued today', icon: FileText, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40' },
        { label: 'Active Structures', value: String(kpis.activeStructuresCount ?? 0), sub: 'fee templates', icon: Layers, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800/40' },
    ];

    const quickActions = [
        { label: 'Create Structure', icon: Plus, path: '/app/finance/structures', color: 'from-emerald-500 to-teal-600' },
        { label: 'Generate Demand', icon: PlusCircle, path: '/app/finance/demands', color: 'from-blue-500 to-indigo-600' },
        { label: 'Collect Payment', icon: Coins, path: '/app/finance/payments', color: 'from-amber-500 to-orange-600' },
        { label: 'Search Ledger', icon: Search, path: '/app/finance/ledger', color: 'from-violet-500 to-purple-600' },
        { label: 'Reports', icon: BarChart2, path: '/app/finance/reports', color: 'from-rose-500 to-pink-600' },
        { label: 'Receipts', icon: Receipt, path: '/app/finance/receipts', color: 'from-cyan-500 to-sky-600' },
    ];

    if (loading) {
        return (
            <div className="p-8 space-y-6 animate-pulse">
                <div className="h-10 w-64 bg-slate-200 dark:bg-white/10 rounded-xl" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array(8).fill(0).map((_, i) => <div key={i} className="h-28 bg-slate-200 dark:bg-white/10 rounded-2xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-64 bg-slate-200 dark:bg-white/10 rounded-2xl" />
                    <div className="h-64 bg-slate-200 dark:bg-white/10 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-8 text-slate-800 dark:text-slate-100">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Finance Dashboard</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-sm font-medium transition-all">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* ── KPI Grid: 4 per row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {kpiCards.map((k) => (
                    <div key={k.label} className={`${GLASS} p-5 flex flex-col gap-3`}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{k.label}</p>
                            <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center`}>
                                <k.icon className={`w-4 h-4 ${k.color}`} />
                            </div>
                        </div>
                        <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
                        {k.sub && <p className="text-[11px] text-slate-400">{k.sub}</p>}
                    </div>
                ))}
            </div>

            {/* ── Quick Actions ── */}
            <div className={`${GLASS} p-5`}>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Quick Actions</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {quickActions.map(a => (
                        <button
                            key={a.label}
                            onClick={() => navigate(a.path)}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl hover:scale-105 transition-all group"
                        >
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                                <a.icon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 text-center leading-tight">{a.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Charts Row 1: Trend + Mode ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Collection Trend */}
                <div className={`${GLASS} p-5`}>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">30-Day Collection Trend</p>
                    {trend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={trend}>
                                <defs>
                                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
                                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                                <Tooltip formatter={(v: any) => [`₹${v.toLocaleString('en-IN')}`, 'Collection']} />
                                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#trendGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No collection data yet</div>
                    )}
                </div>

                {/* Payment Mode Distribution */}
                <div className={`${GLASS} p-5`}>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Payment Mode Distribution (This Month)</p>
                    {modes.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={modes} dataKey="total" nameKey="mode" cx="40%" cy="50%" outerRadius={80} label={({ mode, percent = 0 }) => `${mode} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                    {modes.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Legend iconType="circle" iconSize={8} />
                                <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No payment data yet</div>
                    )}
                </div>
            </div>

            {/* ── Chart Row 2: Outstanding by Class ── */}
            {byClass.length > 0 && (
                <div className={`${GLASS} p-5`}>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Outstanding by Class</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={byClass} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                            <YAxis dataKey="className" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={70} />
                            <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                            <Bar dataKey="outstanding" name="Outstanding" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[0, 4, 4, 0]} />
                            <Legend iconType="circle" iconSize={8} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};
