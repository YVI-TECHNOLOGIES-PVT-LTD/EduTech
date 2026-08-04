import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { Search, RefreshCw, Printer, Mail, Eye, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const GLASS = 'bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-sm';
const TYPE_COLORS: Record<string, string> = {
    ORIGINAL:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    REPRINT:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    DUPLICATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

export const ReceiptCenter = () => {
    const [receipts, setReceipts] = useState<any[]>([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [modeFilter, setModeFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate]     = useState('');
    const [viewing, setViewing]   = useState<any | null>(null);
    const [reprinting, setReprinting] = useState<string | null>(null);

    useEffect(() => { fetchReceipts(); }, []);

    const fetchReceipts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (typeFilter) params.append('receipt_type', typeFilter);
            if (modeFilter) params.append('payment_mode', modeFilter);
            if (fromDate)   params.append('from', fromDate);
            if (toDate)     params.append('to', toDate);
            const { data } = await apiClient.get(`/fees/receipts?${params.toString()}`);
            setReceipts(data?.data || data || []);
        } catch { toast.error('Failed to load receipts'); }
        finally { setLoading(false); }
    };

    const handleReprint = async (id: string) => {
        setReprinting(id);
        try {
            const { data } = await apiClient.post(`/fees/receipts/${id}/reprint`);
            toast.success(`Receipt reprinted — ${data.receipt?.receipt_no}`);
            fetchReceipts();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Reprint failed');
        } finally { setReprinting(null); }
    };

    const handlePrint = (receipt: any) => {
        const win = window.open('', '_blank', 'width=400,height=600');
        if (!win) return;
        const tx = receipt.transaction;
        const student = tx?.student;
        win.document.write(`
            <html><head><title>Receipt ${receipt.receipt_no}</title>
            <style>body{font-family:monospace;padding:24px;font-size:13px}
            h2{text-align:center;border-bottom:1px solid #ccc;padding-bottom:8px}
            .row{display:flex;justify-content:space-between;margin:6px 0}
            .total{font-size:18px;font-weight:bold;border-top:1px dashed #ccc;padding-top:8px;margin-top:8px}
            </style></head>
            <body>
            <h2>FEE RECEIPT</h2>
            <div class="row"><span>Receipt No:</span><span><b>${receipt.receipt_no}</b></span></div>
            <div class="row"><span>Date:</span><span>${new Date(receipt.created_at).toLocaleDateString('en-IN')}</span></div>
            <div class="row"><span>Type:</span><span>${receipt.receipt_type}</span></div>
            <hr/>
            ${student ? `<div class="row"><span>Student:</span><span>${student.full_name}</span></div>
            <div class="row"><span>Code:</span><span>${student.student_code}</span></div>` : ''}
            <hr/>
            <div class="row"><span>Mode:</span><span>${tx?.payment_mode || '—'}</span></div>
            ${tx?.transaction_reference ? `<div class="row"><span>Reference:</span><span>${tx.transaction_reference}</span></div>` : ''}
            <div class="total"><div class="row"><span>Amount Paid:</span><span>₹${Number(tx?.amount || 0).toLocaleString('en-IN')}</span></div></div>
            <br/><p style="text-align:center;font-size:11px;color:#888">Print Count: ${receipt.print_count} &nbsp;|&nbsp; This is a computer generated receipt.</p>
            </body></html>
        `);
        win.document.close();
        win.print();
    };

    const filtered = receipts.filter(r => {
        const name = r.transaction?.student?.full_name || '';
        return !search || name.toLowerCase().includes(search.toLowerCase()) || r.receipt_no?.includes(search);
    });

    return (
        <div className="p-6 md:p-8 space-y-6 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Receipt Center</h1>
                    <p className="text-sm text-slate-500 mt-1">{receipts.length} receipts</p>
                </div>
            </div>

            {/* Filters */}
            <div className={`${GLASS} p-4 flex flex-wrap gap-3`}>
                <div className="relative flex-1 min-w-40">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search receipt or student"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30" />
                </div>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                    className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none">
                    <option value="">All Types</option>
                    {['ORIGINAL','REPRINT','DUPLICATE','CANCELLED'].map(t => <option key={t}>{t}</option>)}
                </select>
                <select value={modeFilter} onChange={e => setModeFilter(e.target.value)}
                    className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none">
                    <option value="">All Modes</option>
                    {['Cash','UPI','Card','Cheque','Bank_Transfer'].map(m => <option key={m}>{m}</option>)}
                </select>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                    className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none" />
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                    className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none" />
                <button onClick={fetchReceipts} className="px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-all">Apply</button>
                <button onClick={fetchReceipts} className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-slate-200 transition-all"><RefreshCw className="w-4 h-4" /></button>
            </div>

            {/* Table */}
            <div className={`${GLASS} overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                                {['Receipt #','Student','Amount','Mode','Type','Collected By','Date','Printed','Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">{Array(9).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-white/10 rounded" /></td>)}</tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={9} className="px-4 py-12 text-center text-slate-400">No receipts found</td></tr>
                            ) : filtered.map(r => {
                                const tx = r.transaction;
                                return (
                                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">{r.receipt_no}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold">{tx?.student?.full_name || '—'}</p>
                                            <p className="text-xs text-slate-400">{tx?.student?.student_code}</p>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">₹{Number(tx?.amount || 0).toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3 text-slate-500">{tx?.payment_mode || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${TYPE_COLORS[r.receipt_type] || ''}`}>{r.receipt_type}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-400">{tx?.cashier?.email || '—'}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                                        <td className="px-4 py-3 text-center text-slate-500">{r.print_count}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setViewing(r)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="View"><Eye className="w-4 h-4" /></button>
                                                <button onClick={() => handlePrint(r)} className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-all" title="Print"><Printer className="w-4 h-4" /></button>
                                                <button onClick={() => handleReprint(r.id)} disabled={reprinting === r.id}
                                                    className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all disabled:opacity-50" title="Reprint">
                                                    <RefreshCw className={`w-4 h-4 ${reprinting === r.id ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Modal */}
            {viewing && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`${GLASS} w-full max-w-md p-6 space-y-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold">Receipt Details</h2>
                            <button onClick={() => setViewing(null)}><XCircle className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="space-y-2 text-sm">
                            {[
                                ['Receipt No', viewing.receipt_no],
                                ['Type', viewing.receipt_type],
                                ['Student', viewing.transaction?.student?.full_name || '—'],
                                ['Amount', `₹${Number(viewing.transaction?.amount || 0).toLocaleString('en-IN')}`],
                                ['Mode', viewing.transaction?.payment_mode || '—'],
                                ['Reference', viewing.transaction?.transaction_reference || '—'],
                                ['Print Count', viewing.print_count],
                                ['Generated', new Date(viewing.created_at).toLocaleString('en-IN')],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between border-b border-slate-100 dark:border-white/10 py-1.5">
                                    <span className="text-slate-500 font-medium">{k}</span>
                                    <span className="font-semibold">{v}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => handlePrint(viewing)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 dark:bg-white/10 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-all">
                                <Printer className="w-4 h-4" /> Print
                            </button>
                            <button onClick={() => { handleReprint(viewing.id); setViewing(null); }}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-semibold transition-all">
                                <RefreshCw className="w-4 h-4" /> Reprint
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
