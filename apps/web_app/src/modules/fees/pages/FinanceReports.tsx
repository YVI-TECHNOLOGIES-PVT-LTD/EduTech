import { useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { BarChart2, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const GLASS = 'bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-sm';
const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

type ReportType = 'collections' | 'outstanding' | 'aging' | 'cash-closing' | 'payment-mode' | 'class-summary';

const REPORTS: { id: ReportType; label: string; desc: string }[] = [
    { id: 'collections',    label: 'Collections',         desc: 'All payments by date range' },
    { id: 'outstanding',    label: 'Outstanding Fees',     desc: 'All pending/partial demands' },
    { id: 'aging',          label: 'Aging Analysis',       desc: 'Overdue by 0-30, 31-60, 61-90, 90+ days' },
    { id: 'cash-closing',   label: 'Cash Closing',         desc: "Today's cashier totals by payment mode" },
    { id: 'payment-mode',   label: 'Payment Mode Analysis', desc: 'Mode-wise collection breakdown' },
    { id: 'class-summary',  label: 'Class Summary',        desc: 'Total billed vs collected per class' },
];

export const FinanceReports = () => {
    const [active, setActive]   = useState<ReportType>('collections');
    const [from, setFrom]       = useState(() => new Date().toISOString().split('T')[0]);
    const [to, setTo]           = useState(() => new Date().toISOString().split('T')[0]);
    const [data, setData]       = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const run = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (['collections', 'payment-mode'].includes(active)) {
                params.set('from', from); params.set('to', to);
            }
            if (active === 'cash-closing') params.set('date', from);
            const { data: res } = await apiClient.get(`/fees/reports/${active}?${params.toString()}`);
            setData(res);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Report failed');
        } finally { setLoading(false); }
    };

    const exportCSV = () => {
        if (!data) return;
        const rows = data.data || data.buckets ? Object.entries(data.buckets || {}).map(([k, v]) => ({ range: k, amount: v })) : [];
        if (!rows.length) return toast.error('No data to export');
        const keys = Object.keys(rows[0]);
        const csv = [keys.join(','), ...rows.map((r: any) => keys.map(k => r[k]).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `${active}_report.csv`; a.click();
    };

    const renderChart = () => {
        if (!data) return null;
        if (active === 'payment-mode' && data.data) {
            return (
                <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                        <Pie data={data.data} dataKey="total" nameKey="mode" cx="40%" cy="50%" outerRadius={100}
                            label={({ mode, percent = 0 }) => `${mode} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {data.data.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Legend iconType="circle" iconSize={8} />
                        <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                    </PieChart>
                </ResponsiveContainer>
            );
        }
        if (active === 'class-summary' && data.data) {
            return (
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.data}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="className" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                        <Legend iconType="circle" iconSize={8} />
                        <Bar dataKey="collected"   name="Collected"   fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="outstanding" name="Outstanding" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            );
        }
        if (active === 'aging' && data.buckets) {
            const chartData = Object.entries(data.buckets).map(([k, v]) => ({ range: k, amount: v }));
            return (
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v as number/1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                        <Bar dataKey="amount" name="Outstanding" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            );
        }
        return null;
    };

    const renderTable = () => {
        if (!data) return null;
        if (active === 'cash-closing') {
            return (
                <div className="space-y-3">
                    <div className="flex justify-between text-sm font-semibold bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
                        <span>Grand Total</span>
                        <span className="text-emerald-600 dark:text-emerald-400">₹{Number(data.grandTotal || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="space-y-1">
                        {Object.entries(data.byMode || {}).map(([mode, total]: any) => (
                            <div key={mode} className="flex justify-between text-sm p-2.5 rounded-lg bg-slate-50 dark:bg-white/5">
                                <span className="text-slate-600 dark:text-slate-400">{mode}</span>
                                <span className="font-semibold">₹{Number(total).toLocaleString('en-IN')}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400">Total transactions: {data.transactionCount}</p>
                </div>
            );
        }
        const rows = data.data || [];
        if (!rows.length) return <p className="text-center text-slate-400 py-8 text-sm">No data for selected parameters</p>;
        const keys = Object.keys(rows[0]).slice(0, 8);
        return (
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                            {keys.map(k => <th key={k} className="px-3 py-2 text-left text-xs font-bold text-slate-500 uppercase">{k.replace(/_/g, ' ')}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {rows.slice(0, 100).map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                {keys.map(k => (
                                    <td key={k} className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
                                        {typeof row[k] === 'number' && k.includes('amount') ? `₹${Number(row[k]).toLocaleString('en-IN')}` : String(row[k] ?? '—').slice(0, 50)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rows.length > 100 && <p className="text-xs text-center text-slate-400 py-2">Showing 100 of {rows.length} rows. Export CSV for full data.</p>}
            </div>
        );
    };

    return (
        <div className="p-6 md:p-8 space-y-6 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-3"><BarChart2 className="w-6 h-6 text-violet-500" /> Finance Reports</h1>
                    <p className="text-sm text-slate-500 mt-1">Generate and export financial reports</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Report Selector */}
                <div className={`${GLASS} p-4 space-y-1 h-fit`}>
                    {REPORTS.map(r => (
                        <button key={r.id} onClick={() => { setActive(r.id); setData(null); }}
                            className={`w-full text-left px-3 py-3 rounded-xl transition-all text-sm ${active === r.id ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-semibold border border-violet-200 dark:border-violet-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                            <p className="font-semibold">{r.label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{r.desc}</p>
                        </button>
                    ))}
                </div>

                {/* Report Panel */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Controls */}
                    <div className={`${GLASS} p-4 flex flex-wrap items-center gap-3`}>
                        {['collections','payment-mode'].includes(active) && (
                            <>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">From</label>
                                    <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">To</label>
                                    <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none" />
                                </div>
                            </>
                        )}
                        {active === 'cash-closing' && (
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Date</label>
                                <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none" />
                            </div>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <button onClick={run} disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all">
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? 'Running...' : 'Run Report'}
                            </button>
                            {data && (
                                <button onClick={exportCSV}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/10 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-all">
                                    <Download className="w-4 h-4" /> CSV
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Chart */}
                    {data && renderChart() && (
                        <div className={`${GLASS} p-5`}>
                            {renderChart()}
                        </div>
                    )}

                    {/* Summary */}
                    {data && (data.total !== undefined || data.grandTotal !== undefined) && (
                        <div className={`${GLASS} p-4 flex items-center gap-4`}>
                            <p className="text-sm font-semibold text-slate-500">Total</p>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                ₹{Number(data.total ?? data.grandTotal ?? 0).toLocaleString('en-IN')}
                            </p>
                        </div>
                    )}

                    {/* Table */}
                    {data && (
                        <div className={`${GLASS} overflow-hidden`}>
                            <div className="p-4 border-b border-slate-200 dark:border-white/10">
                                <p className="text-sm font-bold">{REPORTS.find(r => r.id === active)?.label}</p>
                            </div>
                            <div className="p-1">{renderTable()}</div>
                        </div>
                    )}

                    {!data && !loading && (
                        <div className={`${GLASS} p-12 text-center text-slate-400`}>
                            <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Select a report and click Run Report</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
