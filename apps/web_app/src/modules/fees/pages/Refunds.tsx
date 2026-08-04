import { useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

const GLASS = 'bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-sm';

export const Refunds = () => {
    const [txId, setTxId]       = useState('');
    const [amount, setAmount]   = useState('');
    const [reason, setReason]   = useState('');
    const [studentId, setStudentId] = useState('');
    const [appId, setAppId]     = useState('');
    const [tx, setTx]           = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving]   = useState(false);

    const loadTx = async () => {
        if (!txId.trim()) return;
        setLoading(true);
        try {
            const { data } = await apiClient.get(`/fees/receipts?limit=1`);
            // In real scenario, look up transaction directly
            // For now load demand of student
            setTx({ id: txId.trim(), note: 'Enter student/application ID below' });
        } catch {
            toast.error('Transaction lookup failed');
        } finally { setLoading(false); }
    };

    const handleProcess = async () => {
        if (!amount || Number(amount) <= 0) return toast.error('Enter a valid refund amount');
        setSaving(true);
        try {
            const { data } = await apiClient.post('/fees/refunds', {
                transaction_id: txId || undefined,
                student_id: studentId || undefined,
                application_id: appId || undefined,
                amount: parseFloat(amount),
                reason
            });
            toast.success(data.message);
            setTxId(''); setAmount(''); setReason(''); setStudentId(''); setAppId(''); setTx(null);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Refund failed');
        } finally { setSaving(false); }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 text-slate-800 dark:text-slate-100">
            <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <RefreshCw className="w-6 h-6 text-orange-500" /> Fee Refunds
                </h1>
                <p className="text-sm text-slate-500 mt-1">Process refunds — reverses a credit entry in the student ledger</p>
            </div>

            <div className={`${GLASS} p-6 max-w-xl space-y-5`}>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Transaction ID (optional)</label>
                    <div className="flex gap-2">
                        <input value={txId} onChange={e => setTxId(e.target.value)}
                            placeholder="Payment transaction UUID"
                            className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/30" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Leave blank if refunding without a specific transaction reference</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Student ID</label>
                        <input value={studentId} onChange={e => setStudentId(e.target.value)}
                            placeholder="Student UUID"
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/30" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Application ID</label>
                        <input value={appId} onChange={e => setAppId(e.target.value)}
                            placeholder="Application UUID"
                            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/30" />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Refund Amount (₹)</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min={1}
                        placeholder="Enter refund amount"
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/30" />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Reason</label>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                        placeholder="Withdrawal, duplicate payment, excess collection, etc."
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/30 resize-none" />
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3">
                    <p className="text-xs text-orange-700 dark:text-orange-300 font-semibold">⚠ Refund is permanent and creates a DEBIT entry in the ledger, increasing the student's outstanding balance. Ensure approval before processing.</p>
                </div>

                <button onClick={handleProcess} disabled={saving || (!studentId && !appId) || !amount}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
                    {saving ? 'Processing Refund...' : 'Process Refund'}
                </button>
            </div>
        </div>
    );
};
