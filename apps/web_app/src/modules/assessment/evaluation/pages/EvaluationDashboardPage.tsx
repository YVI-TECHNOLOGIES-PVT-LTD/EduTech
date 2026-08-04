import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Sparkles, ClipboardList, ShieldAlert, Award, FileText, CheckCircle, 
    ArrowUpRight, Clock, Users, Activity, BarChart2, ShieldCheck
} from 'lucide-react';
import { useEvaluation, useEvaluationAnalytics } from '../hooks/useEvaluation';

export const EvaluationDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { sessions, loading, fetchSessions, startSession } = useEvaluation();
    const { metrics, fetchMetrics } = useEvaluationAnalytics();

    const [filterStatus, setFilterStatus] = useState<string>('');

    useEffect(() => {
        fetchSessions(filterStatus || undefined);
        fetchMetrics();
    }, [filterStatus]);

    const handleCreateSession = async () => {
        // Quick session start shortcut modal simulator
        const publishedPaperId = prompt("Enter published paper UUID:");
        const attemptId = prompt("Enter student attempt UUID:");
        if (!publishedPaperId || !attemptId) return;

        try {
            const session = await startSession(publishedPaperId, attemptId);
            alert("Evaluation session initialized!");
            navigate(`/app/assessment/evaluation/workspace/${session.id}`);
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-7xl mx-auto">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-card p-6 rounded-3xl border border-gray-100 shadow-premium-sm">
                <div>
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                        <Sparkles className="w-4.5 h-4.5 text-primary" />
                        Phase 11 Evaluation Console
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        Grading & Scoring Dashboard
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Manage evaluator workload pools, check double-blind variance metrics, and finalize student marks.
                    </p>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={handleCreateSession}
                        className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-premium-md text-xs hover:scale-[1.01]"
                    >
                        Evaluate Attempt Script
                    </button>
                </div>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Total Scripts
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                        {metrics?.totalScripts || 0}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-primary" />
                        Workload allocation maps
                    </div>
                </div>

                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Completion Rate
                    </div>
                    <div className="text-2xl font-black text-emerald-500 mt-2">
                        {metrics?.completionRatePct?.toFixed(1) || '0.0'}%
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        Scored & finalized
                    </div>
                </div>

                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Pending Evaluation
                    </div>
                    <div className="text-2xl font-black text-amber-500 mt-2">
                        {metrics?.pendingScripts || 0}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        Awaiting scoring review
                    </div>
                </div>

                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Active Locks
                    </div>
                    <div className="text-2xl font-black text-rose-500 mt-2">
                        {sessions.filter(s => s.status === 'UNDER_EVALUATION').length}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                        Concurrent grading guards
                    </div>
                </div>
            </div>

            {/* Main contents grids layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Active Workload List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-card rounded-3xl border border-border/40 p-6 shadow-premium-sm space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-150">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                                Evaluation Scripts Assignments
                            </h3>
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="p-2 border border-gray-200 rounded-xl text-xs"
                            >
                                <option value="">All Statuses</option>
                                <option value="UNDER_EVALUATION">Under Evaluation</option>
                                <option value="FINALIZED">Finalized</option>
                                <option value="LOCKED">Locked</option>
                            </select>
                        </div>

                        {loading ? (
                            <div className="text-center py-12 text-xs text-gray-400 font-bold">
                                Loading scripts workload...
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-12 text-xs text-gray-400 font-bold">
                                No scripts assigned matching selected criteria.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {sessions.map(s => (
                                    <div key={s.id} className="py-4 flex justify-between items-center gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-gray-900">Script Attempt ID: {s.attempt_id.substring(0, 8)}</span>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                                                    s.status === 'LOCKED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    s.status === 'UNDER_EVALUATION' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {s.status}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-gray-400">
                                                Assigned: {new Date(s.assigned_at).toLocaleDateString()} | Anonymous Mode: {s.anonymous_mode ? 'Yes' : 'No'}
                                            </div>
                                        </div>

                                        <Link 
                                            to={`/app/assessment/evaluation/workspace/${s.id}`}
                                            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 flex items-center gap-1.5"
                                        >
                                            Open Workspace
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Toolbox list column */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-card rounded-3xl border border-border/40 p-6 shadow-premium-sm">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                            Operations Tools
                        </h3>
                        <div className="space-y-3 text-xs">
                            <Link to="/app/assessment/evaluation/rubrics" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Scoring Rubrics Templates Library
                            </Link>
                            <Link to="/app/assessment/evaluation/moderation" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Blind Moderation Queue
                            </Link>
                            <Link to="/app/assessment/evaluation/revaluation" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Re-evaluation requests ticket desk
                            </Link>
                            <Link to="/app/assessment/evaluation/grades" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Grade scaling & Curve Normalizer
                            </Link>
                            <Link to="/app/assessment/evaluation/analytics" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Subject evaluation statistics report
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default EvaluationDashboardPage;
