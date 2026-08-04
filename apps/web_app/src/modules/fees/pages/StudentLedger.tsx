import { useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { Search, BookOpen, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';

const GLASS = 'bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-sm';

const TX_COLORS: Record<string, { label: string; color: string }> = {
    DEMAND:     { label: 'Demand',     color: 'text-red-600 dark:text-red-400' },
    PAYMENT:    { label: 'Payment',    color: 'text-emerald-600 dark:text-emerald-400' },
    WAIVER:     { label: 'Waiver',     color: 'text-blue-600 dark:text-blue-400' },
    REFUND:     { label: 'Refund',     color: 'text-orange-600 dark:text-orange-400' },
    ADJUSTMENT: { label: 'Adjustment', color: 'text-violet-600 dark:text-violet-400' },
    PENALTY:    { label: 'Penalty',    color: 'text-rose-600 dark:text-rose-400' },
};

export const StudentLedger = () => {
    const [query, setQuery]       = useState('');
    const [results, setResults]   = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [selected, setSelected] = useState<any | null>(null);
    const [ledger, setLedger]     = useState<any[]>([]);
    const [balance, setBalance]   = useState<number>(0);
    const [loadingLedger, setLoadingLedger] = useState(false);

    const handleSearch = async () => {
        if (query.trim().length < 2) return toast.error('Enter at least 2 characters');
        setSearching(true);
        try {
            const { data } = await apiClient.get(`/students?search=${encodeURIComponent(query)}&limit=10`);
            setResults(Array.isArray(data) ? data : data?.data || []);
        } catch {
            toast.error('Student search failed');
        } finally { setSearching(false); }
    };

    const loadLedger = async (student: any) => {
        setSelected(student);
        setResults([]);
        setLoadingLedger(true);
        try {
            const { data } = await apiClient.get(`/fees/ledger/student/${student.id}`);
            setLedger(data?.entries ?? data?.history ?? data ?? []);
            setBalance(data?.balance ?? 0);
        } catch {
            toast.error('Failed to load ledger');
        } finally { setLoadingLedger(false); }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 text-slate-800 dark:text-slate-100">
            <div>
                <h1 className="text-2xl font-black tracking-tight">Student Ledger</h1>
                <p className="text-sm text-slate-500 mt-1">Bank-statement view of fees, payments, waivers, and refunds</p>
            </div>

            {/* Search */}
            <div className={`${GLASS} p-5`}>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Search Student</p>
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="Search by name or student code..."
                            className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                    </div>
                    <button onClick={handleSearch} disabled={searching}
                        className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all">
                        {searching ? 'Searching...' : 'Search'}
                    </button>
                </div>
                {results.length > 0 && (
                    <div className="mt-3 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                        {results.map(s => (
                            <button key={s.id} onClick={() => loadLedger(s)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors border-b border-slate-100 dark:border-white/5 last:border-0 text-left">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                                    {s.full_name?.[0] || 'S'}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{s.full_name}</p>
                                    <p className="text-xs text-slate-400">{s.student_code} · {s.class_name || ''}</p>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-slate-300 ml-auto" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Ledger */}
            {selected && (
                <>
                    {/* Student Card + Balance */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className={`${GLASS} p-5 sm:col-span-2 flex items-center gap-4`}>
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-lg font-black">{selected.full_name}</p>
                                <p className="text-sm text-slate-500">{selected.student_code} · {selected.class_name || 'Student'}</p>
                            </div>
                        </div>
                        <div className={`${GLASS} p-5 flex flex-col justify-between`}>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Balance</p>
                            <p className={`text-3xl font-black mt-2 ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {balance > 0 ? `₹${balance.toLocaleString('en-IN')} owed` : balance < 0 ? `₹${Math.abs(balance).toLocaleString('en-IN')} advance` : 'Cleared'}
                            </p>
                        </div>
                    </div>

                    {/* Bank Statement Table */}
                    <div className={`${GLASS} overflow-hidden`}>
                        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10">
                            <p className="text-sm font-bold">Account Statement</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                                        {['Date','Type','Description','Debit (₹)','Credit (₹)','Balance (₹)'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {loadingLedger ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <tr key={i} className="animate-pulse">{Array(6).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-white/10 rounded" /></td>)}</tr>
                                        ))
                                    ) : ledger.length === 0 ? (
                                        <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No ledger entries found for this student</td></tr>
                                    ) : ledger.map((entry: any) => {
                                        const meta = TX_COLORS[entry.transaction_type] || { label: entry.transaction_type, color: 'text-slate-600' };
                                        const isDebit  = Number(entry.debit) > 0;
                                        const isCredit = Number(entry.credit) > 0;
                                        return (
                                            <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                                    {new Date(entry.created_at).toLocaleDateString('en-IN')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        {isDebit ? <TrendingUp className="w-3.5 h-3.5 text-red-400" /> : <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />}
                                                        <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                                                    {entry.description || entry.reference_type || '—'}
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-red-600 dark:text-red-400">
                                                    {isDebit ? `₹${Number(entry.debit).toLocaleString('en-IN')}` : '—'}
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                                                    {isCredit ? `₹${Number(entry.credit).toLocaleString('en-IN')}` : '—'}
                                                </td>
                                                <td className="px-4 py-3 font-bold">
                                                    ₹{Number(entry.running_balance).toLocaleString('en-IN')}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                {ledger.length > 0 && (
                                    <tfoot>
                                        <tr className="bg-slate-50 dark:bg-white/5 border-t-2 border-slate-300 dark:border-white/20">
                                            <td colSpan={5} className="px-4 py-3 font-bold text-right text-sm">Closing Balance</td>
                                            <td className="px-4 py-3 font-black text-lg">₹{balance.toLocaleString('en-IN')}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
