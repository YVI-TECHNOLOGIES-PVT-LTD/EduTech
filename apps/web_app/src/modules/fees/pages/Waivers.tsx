import { useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import { ShieldCheck, Search } from 'lucide-react';
import { toast } from 'sonner';

const GLASS = 'bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-sm';

export const Waivers = () => {
    const [demandId, setDemandId]     = useState('');
    const [amount, setAmount]         = useState('');
    const [reason, setReason]         = useState('');
    const [studentId, setStudentId]   = useState('');
    const [demand, setDemand]         = useState<any | null>(null);
    const [loading, setLoading]       = useState(false);
    const [saving, setSaving]         = useState(false);

    const loadDemand = async () => {
        if (!demandId.trim()) return toast.error('Enter a demand ID');
        setLoading(true);
        try {
            const { data } = await apiClient.get(`/fees/demands/${demandId.trim()}`);
            setDemand(data);
            setStudentId(data.student_id || '');
        } catch {
            toast.error('Demand not found');
            setDemand(null);
        } finally { setLoading(false); }
    };

    const handleApply = async () => {
        if (!demandId || !amount || Number(amount) <= 0) return toast.error('Enter demand ID and a valid amount');
        setSaving(true);
        try {
            const { data } = await apiClient.post('/fees/waivers', {
                demand_id: demandId,
                student_id: demand?.student_id || undefined,
                application_id: demand?.application_id || undefined,
                amount: parseFloat(amount),
                reason
            });
            toast.success(data.message);
            setDemand(null); setDemandId(''); setAmount(''); setReason('');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Waiver failed');
        } finally { setSaving(false); }
    };

    return (
        <div className="p-6 md:p-8 space-y-6 text-slate-800 dark:text-slate-100">
            <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-blue-500" /> Fee Waivers
                </h1>
                <p className="text-sm text-slate-500 mt-1">Apply fee concessions — posts a credit to the student ledger</p>
            </div>

            <div className={`${GLASS} p-6 max-w-xl space-y-5`}>
                {/* Demand Lookup */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Demand ID or Demand No</label>
                    <div className="flex gap-2">
                        <input value={demandId} onChange={e => setDemandId(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && loadDemand()}
                            placeholder="Demand UUID or DEM-2026-000001"
                            className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30" />
                        <button onClick={loadDemand} disabled={loading}
                            className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50">
                            <Search className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {demand && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-1 text-sm">
                        <p className="font-bold text-blue-800 dark:text-blue-300">{demand.demand_no}</p>
                        <p className="text-slate-600 dark:text-slate-400">Student: <strong>{demand.student?.full_name || demand.application?.applicant_name || '—'}</strong></p>
                        <p className="text-slate-600 dark:text-slate-400">Total: <strong>₹{Number(demand.amount).toLocaleString('en-IN')}</strong></p>
                        <p className="text-red-600 dark:text-red-400 font-bold">Outstanding: ₹{Number(demand.balance_amount).toLocaleString('en-IN')}</p>
                        <p className="text-slate-400 text-xs">Due: {demand.due_date} · Status: {demand.status}</p>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Waiver Amount (₹)</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min={1}
                        max={demand?.balance_amount || undefined}
                        placeholder="Enter waiver amount"
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Reason / Remarks</label>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                        placeholder="Sibling discount, financial hardship, scholarship, etc."
                        className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
                </div>

                <button onClick={handleApply} disabled={saving || !demandId || !amount}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
                    {saving ? 'Applying Waiver...' : 'Apply Waiver'}
                </button>
                <p className="text-xs text-slate-400 text-center">This action posts a WAIVER credit to the student ledger and reduces the outstanding balance. This is permanent and audited.</p>
            </div>
        </div>
    );
};
