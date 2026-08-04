import React, { useEffect, useState } from 'react';
import { admissionApi } from '../admission.api';
import { Admission } from '../admission.types';
import { Search, Filter, Eye, CheckCircle, Clock, AlertCircle, X, ExternalLink, Phone, Square, CheckSquare, Loader2, Trash2, ArrowRight, ChevronRight, Info, BarChart3, Timer, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApplicationDetails } from './ApplicationDetails';
import { useAuth } from '../../../context/AuthContext';
import { mapStatusToEnterpriseLabel } from '../utils/statusMapper';

const SLA_CONFIG: Record<string, number> = {
    submitted: 24,
    under_review: 48,
    docs_verified: 24,
    payment_submitted: 48,
    payment_verified: 24,
    recommended: 72,
    approved: 168,
    enrolled: 0
};

export const AdmissionReviewList = () => {
    const [applications, setApplications] = useState<Admission[]>([]);
    const [statsData, setStatsData] = useState<any[]>([]); // Lightweight data for KPIs/Funnel
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const [filter, setFilter] = useState('submitted');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const { hasPermission } = useAuth();

    // Selection & Filter State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBreachedOnly, setShowBreachedOnly] = useState(false);

    // Batch Processing State
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, failures: [] as string[] });
    const [showBatchConfirm, setShowBatchConfirm] = useState(false);
    const [batchActionType, setBatchActionType] = useState<'review' | 'verify' | 'recommend' | 'approve' | 'reject' | 'verify_fee' | null>(null);
    const [batchRemarks, setBatchRemarks] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchApps();
    }, [page, limit, filter, searchQuery]);
    // Debouncing search is recommended but for now direct dependency is fine as per "Search... combined logic"

    // Reset page on filter/search change
    useEffect(() => {
        setPage(1);
    }, [filter, searchQuery]);

    // Reset selection on tab/search change or drawer open
    useEffect(() => {
        setSelectedIds(new Set());
    }, [filter, searchQuery, selectedAppId, page]); // Also clear on page change

    const getAgingInfo = (app: any) => {
        if (!app.updated_at && !app.created_at) return { label: 'N/A', diffHours: 0, slaHours: 0, status: 'within' as const };
        const start = new Date(app.updated_at || app.created_at).getTime();
        const now = new Date().getTime();
        const diffHours = (now - start) / (1000 * 60 * 60);
        const slaHours = SLA_CONFIG[app.status] || 72;

        let status: 'within' | 'approaching' | 'breached' = 'within';
        if (diffHours >= slaHours && slaHours > 0) status = 'breached';
        else if (diffHours >= slaHours * 0.7 && slaHours > 0) status = 'approaching';

        const days = Math.floor(diffHours / 24);
        const hours = Math.floor(diffHours % 24);
        const label = days > 0 ? `${days}d ${hours}h` : `${hours}h`;

        return { label, diffHours, slaHours, status };
    };

    const stats = React.useMemo(() => {
        // Use statsData for global KPIs
        const today = new Date().toISOString().split('T')[0];
        const totalPending = statsData.filter(a => ['submitted', 'under_review'].includes(a.status)).length;
        const verifiedToday = statsData.filter(a =>
            (['docs_verified', 'payment_verified'].includes(a.status) && a.updated_at?.startsWith(today))
        ).length;

        const enrolled = statsData.filter(a => a.status === 'enrolled').length;
        const submitted = statsData.filter(a => !['draft'].includes(a.status)).length; // Use statsData
        const conversionRate = submitted > 0 ? ((enrolled / submitted) * 100).toFixed(1) : '0';

        return { totalPending, verifiedToday, conversionRate };
    }, [statsData]);

    // Server-side filtering, no client-side filtering needed for 'filteredApps' 
    // BUT 'filteredApps' was used for sorting too. 
    // Now 'applications' IS the filtered list for the current page.
    const filteredApps = applications; // Directly map to state

    const funnelSteps = React.useMemo(() => {
        // Use statsData for Funnel
        const sequence = ['submitted', 'under_review', 'docs_verified', 'payment_submitted', 'payment_verified', 'recommended', 'approved', 'enrolled'];
        const totalNonDraft = statsData.filter(a => a.status !== 'draft').length;

        return sequence.map((s, idx) => {
            const bucket = statsData.filter(a => a.status === s);
            const currentBucket = bucket.length;
            const hasBreachInStage = bucket.some(a => getAgingInfo(a).status === 'breached');

            const volumeReached = statsData.filter(a => {
                const sIdx = sequence.indexOf(a.status);
                return sIdx >= idx;
            }).length;

            const prevVolume = idx > 0 ? statsData.filter(a => {
                const sIdx = sequence.indexOf(a.status);
                return sIdx >= idx - 1;
            }).length : totalNonDraft;

            const prevBucketCount = idx > 0 ? statsData.filter(a => a.status === sequence[idx - 1]).length : 0;

            const finishedPrevious = prevVolume - prevBucketCount;
            const dropOffCount = Math.max(0, finishedPrevious - volumeReached);
            const dropOffRate = finishedPrevious > 0 ? (dropOffCount / finishedPrevious) * 100 : 0;

            let bgColor = 'bg-blue-500';
            if (idx >= 2 && idx <= 4) bgColor = 'bg-amber-500';
            if (idx >= 5) bgColor = 'bg-emerald-500';
            if (s === 'enrolled') bgColor = 'bg-indigo-600';

            return {
                status: s,
                label: s.replace('_', ' '),
                count: currentBucket,
                volume: volumeReached,
                dropOff: dropOffRate.toFixed(1),
                color: bgColor,
                hasBreach: hasBreachInStage,
                helperText: getHelperText(s)
            };
        });
    }, [statsData]);

    function getHelperText(status: string) {
        switch (status) {
            case 'submitted': return 'Initial applications received';
            case 'under_review': return 'Assigned to admissions officers';
            case 'docs_verified': return 'ID & Academic records checked';
            case 'payment_submitted': return 'Fee proof uploaded by parent';
            case 'payment_verified': return 'Finance department approval';
            case 'recommended': return 'Final review by HOI';
            case 'approved': return 'Offer letter issued';
            case 'enrolled': return 'Student record created';
            default: return '';
        }
    }

    const fetchApps = async () => {
        setLoading(true);
        try {
            const { data } = await admissionApi.list({
                status: filter,
                search: searchQuery,
                page,
                limit
            });
            console.log('[AdmissionReviewList] API Response:', data);
            setApplications(data.data || []);
            setTotalPages(data.meta?.totalPages || 1);
            setTotalRecords(data.meta?.total || 0);
        } catch (error) {
            console.error('Failed to fetch applications', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const { data } = await admissionApi.getStats();
            setStatsData(data);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'submitted': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'under_review': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'recommended': return 'bg-purple-50 text-purple-600 border-purple-100';
            case 'approved': return 'bg-green-50 text-green-600 border-green-100';
            case 'rejected': return 'bg-red-50 text-red-600 border-red-100';
            case 'enrolled': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredApps.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredApps.map(app => app.id)));
        }
    };

    const toggleSelection = (id: string) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedIds(newSelection);
    };

    const handleBatchExecute = async () => {
        if (!batchActionType || selectedIds.size === 0) return;

        setIsBatchProcessing(true);
        setBatchProgress({ current: 0, total: selectedIds.size, failures: [] });

        const ids = Array.from(selectedIds);
        const failures: string[] = [];

        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            try {
                if (batchActionType === 'review') await admissionApi.review(id, batchRemarks);
                if (batchActionType === 'verify') await admissionApi.verifyDocs(id, batchRemarks);
                if (batchActionType === 'recommend') await admissionApi.recommend(id, batchRemarks);
                if (batchActionType === 'approve') await admissionApi.approve(id, batchRemarks);
                if (batchActionType === 'reject') await admissionApi.reject(id, batchRemarks);
                if (batchActionType === 'verify_fee') await admissionApi.verifyFee(id, 'verified', batchRemarks || 'Batch processed');

                setBatchProgress(prev => ({ ...prev, current: i + 1 }));
            } catch (err) {
                console.error(`Batch action fail for ${id}:`, err);
                failures.push(id);
                setBatchProgress(prev => ({ ...prev, failures: [...prev.failures, id], current: i + 1 }));
            }
        }

        await fetchApps();
        setIsBatchProcessing(false);
        if (failures.length === 0) {
            setShowBatchConfirm(false);
            setSelectedIds(new Set());
            setBatchRemarks('');
        }
    };

    return (
        <div className="p-6 space-y-8 bg-gray-50/30 min-h-screen">
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-xl shadow-blue-100 text-white relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <p className="text-blue-100 text-xs font-black uppercase tracking-widest mb-1">Total Pending</p>
                        <h4 className="text-4xl font-black">{stats.totalPending}</h4>
                        <div className="mt-4 flex items-center gap-2 text-xs text-blue-100/80">
                            <Clock className="w-3 h-3" />
                            <span>Awaiting action from review team</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Verified Today</p>
                        <h4 className="text-4xl font-black text-gray-900">{stats.verifiedToday}</h4>
                        <div className="mt-4 flex items-center gap-2 text-xs text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full w-fit">
                            <CheckCircle className="w-3 h-3" />
                            <span>Documents & Payments</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Conversion Rate</p>
                        <h4 className="text-4xl font-black text-gray-900">{stats.conversionRate}%</h4>
                        <div className="mt-4 flex items-center gap-2 text-xs text-purple-600 font-bold bg-purple-50 px-3 py-1 rounded-full w-fit">
                            <AlertCircle className="w-3 h-3" />
                            <span>Applications to Enrolled</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <CheckCircle className="text-blue-600 w-10 h-10" />
                        Admission Queue
                    </h1>
                    <p className="text-gray-500 font-medium">Review and manage pending admission requests</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <button
                        onClick={() => setShowBreachedOnly(!showBreachedOnly)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${showBreachedOnly
                            ? 'bg-red-600 text-white shadow-lg shadow-red-100'
                            : 'bg-white text-gray-400 border border-gray-100 hover:text-red-500 hover:bg-red-50'
                            }`}
                    >
                        <AlertTriangle className={`w-4 h-4 ${showBreachedOnly ? 'animate-pulse' : ''}`} />
                        SLA Breached Only
                    </button>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, ID or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all w-full sm:w-80 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={fetchApps}
                        disabled={loading}
                        className="bg-white border border-gray-200 p-3 rounded-2xl hover:bg-gray-50 text-gray-600 transition-all shadow-sm disabled:opacity-50"
                        title="Refresh Data"
                    >
                        <Clock className={`w-5 h-5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Funnel Visualization */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 className="w-3 h-3" />
                        Admission Conversion Funnel
                    </h3>
                    <button
                        onClick={() => { setFilter('rejected'); setSelectedIds(new Set()); }}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${filter === 'rejected'
                            ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-100'
                            : 'bg-white text-gray-400 border-gray-100 hover:text-red-500 hover:bg-red-50'
                            }`}
                    >
                        View Rejected ({applications.filter(a => a.status === 'rejected').length})
                    </button>
                </div>

                <div className="relative">
                    <div className="flex flex-col md:flex-row items-stretch gap-1.5 overflow-x-auto pb-4 scrollbar-hide snap-x">
                        {funnelSteps.map((step, idx) => {
                            const isActive = filter === step.status;
                            const totalApps = applications.filter(a => a.status !== 'draft').length;
                            const heightScale = totalApps > 0 ? (step.volume / totalApps) : 1;

                            return (
                                <div
                                    key={step.status}
                                    onClick={() => { setFilter(step.status); setSelectedIds(new Set()); }}
                                    className={`relative flex-1 min-w-[140px] cursor-pointer group snap-start transition-all duration-500 ${isActive ? 'scale-[1.02] z-10' : 'hover:scale-[1.01]'}`}
                                >
                                    <div className="flex flex-col h-full">
                                        <div className="flex-1 flex flex-col justify-end min-h-[140px]">
                                            <div
                                                className={`w-full rounded-2xl transition-all duration-700 relative overflow-hidden flex flex-col items-center justify-center p-4 border-2 ${isActive
                                                    ? `${step.color} border-white ring-4 ring-indigo-50 shadow-2xl`
                                                    : `${step.color} border-transparent opacity-60 grayscale-[0.3] hover:opacity-100 hover:grayscale-0`
                                                    }`}
                                                style={{ height: `${Math.max(40, heightScale * 100)}%` }}
                                            >
                                                {/* Sparkle effect for funnel visual */}
                                                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

                                                {step.hasBreach && (
                                                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full animate-ping" />
                                                )}

                                                <div className="relative z-10 text-center">
                                                    <p className={`text-[10px] font-black uppercase tracking-tighter mb-1 transition-colors ${isActive ? 'text-white' : 'text-white/80'}`}>
                                                        {step.label}
                                                    </p>
                                                    <h5 className="text-2xl font-black text-white leading-none">
                                                        {step.count}
                                                    </h5>
                                                    <p className="text-[8px] font-bold text-white/60 uppercase mt-1">Pending</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Drop-off & Connection */}
                                        <div className="mt-3 flex flex-col items-center">
                                            {idx > 0 && parseFloat(step.dropOff) > 0 && (
                                                <div className="mb-2 flex items-center gap-1.5 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full animate-bounce">
                                                    <span className="text-[8px] font-black text-red-500">-{step.dropOff}%</span>
                                                </div>
                                            )}
                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest transition-colors group-hover:text-indigo-600">
                                                {step.volume} Reached
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tooltip on Hover */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 bg-gray-900 text-white p-4 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{step.label}</p>
                                            <p className="text-xs text-gray-300 leading-relaxed font-medium">
                                                {step.helperText}
                                            </p>
                                            <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase">WIP Vol</span>
                                                <span className="text-sm font-black text-white">{step.count}</span>
                                            </div>
                                            {step.hasBreach && (
                                                <div className="flex justify-between items-center bg-red-500/10 px-2 py-1 rounded-md">
                                                    <span className="text-[9px] font-bold text-red-400 uppercase">Latency</span>
                                                    <span className="text-[10px] font-black text-red-400">SLA BREACHED</span>
                                                </div>
                                            )}
                                            {idx > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase">Drop-off</span>
                                                    <span className="text-sm font-black text-red-400">{step.dropOff}%</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-900" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Batch Action Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-indigo-600/95 backdrop-blur shadow-2xl shadow-indigo-200 border border-indigo-500 p-4 rounded-3xl flex items-center justify-between text-white sticky top-4 z-40 transition-all animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4 px-2">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <CheckSquare className="w-5 h-5 text-indigo-100" />
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase tracking-widest">{selectedIds.size} Applications Selected</p>
                            <p className="text-[10px] font-bold text-indigo-100">Click actions below to process them together</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {filter === 'submitted' && hasPermission('admission.review') && (
                            <button
                                onClick={() => { setBatchActionType('review'); setShowBatchConfirm(true); }}
                                className="bg-white hover:bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
                            >
                                <Clock className="w-3 h-3" />
                                Start Review
                            </button>
                        )}
                        {filter === 'under_review' && hasPermission('admission.review') && (
                            <button
                                onClick={() => { setBatchActionType('verify'); setShowBatchConfirm(true); }}
                                className="bg-white hover:bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
                            >
                                <CheckCircle className="w-3 h-3" />
                                Verify Documents
                            </button>
                        )}
                        {filter === 'payment_submitted' && hasPermission('admission.approve') && (
                            <button
                                onClick={() => { setBatchActionType('verify_fee'); setShowBatchConfirm(true); }}
                                className="bg-white hover:bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
                            >
                                <CheckCircle className="w-3 h-3" />
                                Verify Payments
                            </button>
                        )}
                        {filter === 'recommended' && hasPermission('admission.approve') && (
                            <button
                                onClick={() => { setBatchActionType('approve'); setShowBatchConfirm(true); }}
                                className="bg-white hover:bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
                            >
                                <CheckCircle className="w-3 h-3" />
                                Final Approval
                            </button>
                        )}
                        {hasPermission('admission.reject') && (
                            <button
                                onClick={() => { setBatchActionType('reject'); setShowBatchConfirm(true); }}
                                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 border border-red-400"
                            >
                                <Trash2 className="w-3 h-3" />
                                Batch Reject
                            </button>
                        )}
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl transition-all"
                            title="Clear Selection"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-blue-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 w-12">
                                    <button
                                        onClick={toggleSelectAll}
                                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {selectedIds.size === filteredApps.length && filteredApps.length > 0
                                            ? <CheckSquare className="w-5 h-5 text-indigo-600" />
                                            : <Square className="w-5 h-5" />
                                        }
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Grade</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Parent</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Aging</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Hydrating Queue...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredApps.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <div className="max-w-xs mx-auto space-y-4">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                                                <Filter className="w-8 h-8 text-gray-200" />
                                            </div>
                                            <div>
                                                <p className="text-gray-900 font-black text-lg">No Results Found</p>
                                                <p className="text-gray-400 text-sm mt-1">
                                                    We couldn't find any applications in <strong>{filter.replace('_', ' ')}</strong> that match your criteria.
                                                </p>
                                            </div>
                                            {(searchQuery || showBreachedOnly) && (
                                                <button
                                                    onClick={() => { setSearchQuery(''); setShowBreachedOnly(false); }}
                                                    className="text-blue-600 font-bold text-sm hover:underline"
                                                >
                                                    Clear search & filters
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredApps.map((app) => {
                                const aging = getAgingInfo(app);
                                return (
                                    <tr key={app.id} className={`hover:bg-blue-50/20 transition-all border-b border-gray-50 group ${selectedIds.has(app.id) ? 'bg-indigo-50/30' : ''}`}>
                                        <td className="px-6 py-5">
                                            <button
                                                onClick={() => toggleSelection(app.id)}
                                                className="text-gray-400 hover:text-indigo-600 transition-colors"
                                            >
                                                {selectedIds.has(app.id)
                                                    ? <CheckSquare className="w-5 h-5 text-indigo-600" />
                                                    : <Square className="w-5 h-5 text-gray-200" />
                                                }
                                            </button>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors uppercase tracking-tight">{app.student_name}</div>
                                            <div className="text-[10px] font-black text-gray-300 mt-0.5 tracking-tighter">ID: {app.id.toUpperCase()}</div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="bg-gray-100 text-gray-600 text-[10px] font-black px-2 py-1 rounded-md uppercase">
                                                {app.grade_applied_for}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="text-sm font-bold text-gray-700">{app.parent_name || 'N/A'}</div>
                                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                <Phone className="w-3 h-3" />
                                                {app.parent_phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${getStatusStyle(app.status)}`}>
                                                {mapStatusToEnterpriseLabel(app.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div
                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black transition-all ${aging.status === 'breached' ? 'bg-red-50 text-red-600 border-red-100 shadow-sm shadow-red-50' :
                                                    aging.status === 'approaching' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        'bg-green-50 text-green-600 border-green-100'
                                                    }`}
                                                title={`Time in current status: ${aging.label} (SLA: ${aging.slaHours}h)`}
                                            >
                                                <Timer className="w-3 h-3" />
                                                {aging.label}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedAppId(app.id)}
                                                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 uppercase tracking-widest"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Review
                                                </button>
                                                <Link
                                                    to={`/app/admissions/review/${app.id}`}
                                                    className="p-2.5 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                    title="Open as full page"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-gray-100 mb-20 shadow-sm">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Rows per page
                    </span>
                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold p-2 outline-none focus:ring-2 focus:ring-blue-100"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                    <span className="text-xs font-bold text-gray-400">
                        Total {totalRecords} records
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>
                    <span className="text-sm font-black text-gray-900 px-2">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Slide-over Review Drawer */}
            <div className={`fixed inset-0 z-50 transition-all duration-500 ${selectedAppId ? 'visible' : 'invisible'}`}>
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-500 ${selectedAppId ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setSelectedAppId(null)}
                />

                {/* Drawer Content */}
                <div className={`absolute right-0 inset-y-0 w-full md:w-[45%] bg-white shadow-2xl transition-transform duration-500 transform ${selectedAppId ? 'translate-x-0' : 'translate-x-full'}`}>
                    {selectedAppId && (
                        <div className="h-full flex flex-col bg-gray-50/30">
                            {/* Sticky Drawer Header */}
                            <div className="sticky top-0 z-20 bg-white border-b border-gray-100 p-6 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Review Application</h2>
                                        <p className="text-xs font-bold text-blue-600 tracking-widest mt-1">
                                            ID: {selectedAppId?.toUpperCase()}
                                        </p>
                                    </div>
                                    {(() => {
                                        const app = applications.find(a => a.id === selectedAppId);
                                        if (!app) return null;
                                        const aging = getAgingInfo(app);
                                        return (
                                            <div className={`px-3 py-1.5 rounded-xl border flex flex-col items-center ${aging.status === 'breached' ? 'bg-red-50 border-red-100 text-red-600' :
                                                aging.status === 'approaching' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                                    'bg-green-50 border-green-100 text-green-600'
                                                }`}>
                                                <span className="text-[8px] font-black uppercase tracking-widest">Current Aging</span>
                                                <span className="text-xs font-black">{aging.label}</span>
                                                {aging.status === 'breached' && (
                                                    <span className="text-[7px] font-black uppercase mt-0.5 animate-pulse">SLA Breached</span>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <button
                                    onClick={() => setSelectedAppId(null)}
                                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Application Detail View */}
                            <div className="flex-1 overflow-y-auto">
                                <ApplicationDetails
                                    id={selectedAppId || undefined}
                                    mode="drawer"
                                    onActionSuccess={() => fetchApps()}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Batch Action Confirmation Modal */}
            {
                showBatchConfirm && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity" onClick={() => !isBatchProcessing && setShowBatchConfirm(false)} />
                        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`p-4 rounded-2xl ${batchActionType === 'reject' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                        {batchActionType === 'reject' ? <Trash2 className="w-6 h-6" /> : <ArrowRight className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Confirm Batch Action</h3>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{selectedIds.size} Applications Affected</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Target Action</p>
                                        <p className="text-sm font-black text-gray-900">
                                            {batchActionType === 'review' && 'START ADMISSION REVIEW'}
                                            {batchActionType === 'verify' && 'VERIFY DOCUMENTS'}
                                            {batchActionType === 'verify_fee' && 'VERIFY PAYMENTS'}
                                            {batchActionType === 'recommend' && 'RECOMMEND TO HOI'}
                                            {batchActionType === 'approve' && 'FINAL ADMISSION APPROVAL'}
                                            {batchActionType === 'reject' && 'REJECT APPLICATIONS'}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Remarks / Internal Note</label>
                                        <textarea
                                            value={batchRemarks}
                                            onChange={(e) => setBatchRemarks(e.target.value)}
                                            placeholder="Add a remark for this batch..."
                                            disabled={isBatchProcessing}
                                            className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 text-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all resize-none h-24"
                                        />
                                    </div>

                                    {isBatchProcessing && (
                                        <div className="space-y-4">
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-600 transition-all duration-300"
                                                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                <span>Processing {batchProgress.current} / {batchProgress.total}</span>
                                                {batchProgress.failures.length > 0 && <span className="text-red-500">{batchProgress.failures.length} Failed</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 flex gap-3">
                                    {!isBatchProcessing ? (
                                        <>
                                            <button
                                                onClick={() => setShowBatchConfirm(false)}
                                                className="flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleBatchExecute}
                                                className={`flex-1 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl transition-all ${batchActionType === 'reject' ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}
                                            >
                                                Confirm Action
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full bg-gray-100 text-gray-400 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3"
                                        >
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing Batch...
                                        </button>
                                    )}
                                </div>

                                {batchProgress.failures.length > 0 && !isBatchProcessing && (
                                    <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100">
                                        <div className="flex items-center gap-2 text-red-600 mb-2">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="text-xs font-black uppercase tracking-widest">Some Failures Occurred</span>
                                        </div>
                                        <p className="text-[10px] text-red-500 font-bold leading-relaxed overflow-y-auto max-h-20">
                                            Failed IDs: {batchProgress.failures.join(', ')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
