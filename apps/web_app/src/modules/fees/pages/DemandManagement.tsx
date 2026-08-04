import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api-client';
import {
    FileText, Plus, RefreshCw, Search, ChevronDown,
    CheckCircle, XCircle, Clock, AlertTriangle, Users, Layers
} from 'lucide-react';
import { toast } from 'sonner';

const GLASS = 'bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/30 dark:border-white/10 rounded-2xl shadow-sm';
const STATUS_COLORS: Record<string, string> = {
    PENDING:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    PARTIAL:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    PAID:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    OVERDUE:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    CANCELLED: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500',
};

type GenMode = 'single' | 'class' | 'section' | 'custom';

export const DemandManagement = () => {
    const [demands, setDemands]   = useState<any[]>([]);
    const [structures, setStructures] = useState<any[]>([]);
    const [classes, setClasses]   = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showGenerate, setShowGenerate] = useState(false);
    const [genMode, setGenMode]   = useState<GenMode>('single');
    const [genForm, setGenForm]   = useState({ student_id: '', class_id: '', section_id: '', student_ids: '', fee_structure_id: '', due_date: '' });
    const [saving, setSaving]     = useState(false);
    const [cancelId, setCancelId] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState('');

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [demRes, strRes, clsRes] = await Promise.all([
                apiClient.get('/fees/demands'),
                apiClient.get('/fees/structures'),
                apiClient.get('/academic/classes').catch(() => ({ data: [] })),
            ]);
            setDemands(demRes.data || []);
            setStructures(strRes.data || []);
            setClasses(clsRes.data || []);
        } catch { toast.error('Failed to load demands'); }
        finally { setLoading(false); }
    };

    const fetchSections = async (classId: string) => {
        try {
            const { data } = await apiClient.get(`/academic/sections?class_id=${classId}`);
            setSections(data || []);
        } catch { setSections([]); }
    };

    const handleGenerate = async () => {
        if (!genForm.fee_structure_id || !genForm.due_date) {
            return toast.error('Fee structure and due date are required');
        }
        setSaving(true);
        try {
            if (genMode === 'single') {
                await apiClient.post('/fees/demands/generate', {
                    student_id: genForm.student_id || undefined,
                    fee_structure_id: genForm.fee_structure_id,
                    due_date: genForm.due_date
                });
                toast.success('Demand generated');
            } else {
                const payload: any = {
                    mode: genMode,
                    fee_structure_id: genForm.fee_structure_id,
                    due_date: genForm.due_date
                };
                if (genMode === 'class') payload.class_id = genForm.class_id;
                if (genMode === 'section') payload.section_id = genForm.section_id;
                if (genMode === 'custom') payload.student_ids = genForm.student_ids.split(',').map(s => s.trim()).filter(Boolean);
                const { data } = await apiClient.post('/fees/demands/bulk-generate', payload);
                toast.success(`Generated ${data.generated} demands, skipped ${data.skipped} existing`);
            }
            setShowGenerate(false);
            fetchAll();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to generate demand');
        } finally { setSaving(false); }
    };

    const handleCancel = async () => {
        if (!cancelId) return;
        try {
            await apiClient.patch(`/fees/demands/${cancelId}/cancel`, { reason: cancelReason });
            toast.success('Demand cancelled');
            setCancelId(null);
            setCancelReason('');
            fetchAll();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Cancel failed');
        }
    };

    const filtered = demands.filter(d => {
        const name = d.student?.full_name || d.application?.applicant_name || '';
        const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || d.demand_no?.includes(search);
        const matchStatus = !statusFilter || d.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div className="p-6 md:p-8 space-y-6 text-slate-800 dark:text-slate-100">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Fee Demands</h1>
                    <p className="text-sm text-slate-500 mt-1">{demands.length} total demands</p>
                </div>
                <button onClick={() => setShowGenerate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-emerald-200 dark:hover:shadow-emerald-900/40 transition-all">
                    <Plus className="w-4 h-4" /> Generate Demand
                </button>
            </div>

            {/* Filters */}
            <div className={`${GLASS} p-4 flex flex-wrap gap-3`}>
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30"
                        placeholder="Search by student or demand #" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30">
                    <option value="">All Status</option>
                    {['PENDING','PARTIAL','PAID','OVERDUE','CANCELLED'].map(s => <option key={s}>{s}</option>)}
                </select>
                <button onClick={fetchAll} className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Table */}
            <div className={`${GLASS} overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                                {['Demand No','Student / Applicant','Fee Structure','Total (₹)','Outstanding (₹)','Due Date','Status','Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {Array(8).fill(0).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-200 dark:bg-white/10 rounded" /></td>)}
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No demands found</td></tr>
                            ) : filtered.map(d => {
                                const name = d.student?.full_name || d.application?.applicant_name || '—';
                                const code = d.student?.student_code || '';
                                return (
                                    <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">{d.demand_no}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold">{name}</p>
                                            {code && <p className="text-xs text-slate-400">{code}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{d.fee_structure?.name || '—'}</td>
                                        <td className="px-4 py-3 font-semibold">₹{Number(d.amount).toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3 font-bold text-orange-600 dark:text-orange-400">₹{Number(d.balance_amount).toLocaleString('en-IN')}</td>
                                        <td className="px-4 py-3 text-slate-500">{d.due_date}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${STATUS_COLORS[d.status] || ''}`}>{d.status}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {d.status !== 'PAID' && d.status !== 'CANCELLED' && (
                                                <button onClick={() => { setCancelId(d.id); setCancelReason(''); }}
                                                    className="text-xs text-red-500 hover:text-red-700 font-semibold">Cancel</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Generate Dialog */}
            {showGenerate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`${GLASS} w-full max-w-lg p-6 space-y-5`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold">Generate Fee Demand</h2>
                            <button onClick={() => setShowGenerate(false)}><XCircle className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        {/* Mode Tabs */}
                        <div className="grid grid-cols-4 gap-2">
                            {([['single','Single Student',Users],['class','Entire Class',Layers],['section','Section',Layers],['custom','Custom',FileText]] as any[]).map(([m, label, Icon]) => (
                                <button key={m} onClick={() => setGenMode(m)}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-semibold border transition-all ${genMode === m ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300'}`}>
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </button>
                            ))}
                        </div>
                        {/* Form fields */}
                        <div className="space-y-3">
                            {genMode === 'single' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Student ID</label>
                                    <input value={genForm.student_id} onChange={e => setGenForm(f => ({ ...f, student_id: e.target.value }))}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30"
                                        placeholder="Student UUID" />
                                </div>
                            )}
                            {genMode === 'class' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Class</label>
                                    <select value={genForm.class_id} onChange={e => { setGenForm(f => ({ ...f, class_id: e.target.value })); fetchSections(e.target.value); }}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30">
                                        <option value="">Select class</option>
                                        {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}
                            {genMode === 'section' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Class</label>
                                        <select value={genForm.class_id} onChange={e => { setGenForm(f => ({ ...f, class_id: e.target.value })); fetchSections(e.target.value); }}
                                            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none">
                                            <option value="">Select</option>
                                            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Section</label>
                                        <select value={genForm.section_id} onChange={e => setGenForm(f => ({ ...f, section_id: e.target.value }))}
                                            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none">
                                            <option value="">Select</option>
                                            {sections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                            {genMode === 'custom' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Student IDs (comma-separated)</label>
                                    <textarea value={genForm.student_ids} onChange={e => setGenForm(f => ({ ...f, student_ids: e.target.value }))}
                                        rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                                        placeholder="uuid1, uuid2, uuid3..." />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Fee Structure</label>
                                <select value={genForm.fee_structure_id} onChange={e => setGenForm(f => ({ ...f, fee_structure_id: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30">
                                    <option value="">Select structure</option>
                                    {structures.map((s: any) => <option key={s.id} value={s.id}>{s.name} v{s.version}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Due Date</label>
                                <input type="date" value={genForm.due_date} onChange={e => setGenForm(f => ({ ...f, due_date: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30" />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setShowGenerate(false)} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Cancel</button>
                            <button onClick={handleGenerate} disabled={saving}
                                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold disabled:opacity-50 transition-all">
                                {saving ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Dialog */}
            {cancelId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`${GLASS} w-full max-w-sm p-6 space-y-4`}>
                        <h2 className="text-lg font-bold text-red-600">Cancel Demand</h2>
                        <p className="text-sm text-slate-500">This will cancel the billing demand. This cannot be undone.</p>
                        <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                            rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none resize-none"
                            placeholder="Reason for cancellation (optional)" />
                        <div className="flex gap-3">
                            <button onClick={() => setCancelId(null)} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">Back</button>
                            <button onClick={handleCancel} className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all">Confirm Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
