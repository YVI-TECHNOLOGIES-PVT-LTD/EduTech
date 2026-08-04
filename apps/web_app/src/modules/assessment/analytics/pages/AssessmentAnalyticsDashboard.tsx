import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Sparkles, ClipboardList, ShieldAlert, Award, FileText, CheckCircle, 
    ArrowUpRight, Clock, Users, Activity, BarChart2, ShieldCheck, RefreshCw, Layers
} from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';

export const AssessmentAnalyticsDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { snapshots, loading, createSnapshot } = useAnalytics();

    const handleCreateSnapshot = async () => {
        const yearId = prompt("Enter Academic Year UUID to snapshot:");
        if (!yearId) return;

        try {
            await createSnapshot('ACADEMIC_YEAR', yearId);
            alert("Accreditation metrics snapshot successfully saved!");
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
                        Accreditation & Quality Control Desk
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        Assessment Analytics Dashboard
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">
                        NBA, NAAC accreditation audits compliance tracking and course learning outcome attainment rates.
                    </p>
                </div>

                <button 
                    onClick={handleCreateSnapshot}
                    className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-premium-md text-xs hover:scale-[1.01]"
                >
                    Run Accreditation Snapshot
                </button>
            </div>

            {/* Quick KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        NBA Target Attainment
                    </div>
                    <div className="text-2xl font-black text-emerald-500 mt-2">
                        88.5%
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        Target met compliance
                    </div>
                </div>

                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        NAAC Criterion 1
                    </div>
                    <div className="text-2xl font-black text-primary mt-2">
                        3.65 / 4.00
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-primary" />
                        Curricular Aspects
                    </div>
                </div>

                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        High Risk Students
                    </div>
                    <div className="text-2xl font-black text-rose-500 mt-2">
                        3 Students
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                        Remedial intervention warnings
                    </div>
                </div>

                <div className="bg-white dark:bg-card p-6 rounded-3xl border border-border/50 shadow-premium-sm">
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Bloom Compliance
                    </div>
                    <div className="text-2xl font-black text-violet-500 mt-2">
                        92.4%
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-violet-500" />
                        Cognitive levels mapping
                    </div>
                </div>
            </div>

            {/* Main splits */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Active historical snapshots */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-card rounded-3xl border border-border/40 p-6 shadow-premium-sm space-y-4">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                            Time-Series Accreditation Snapshots
                        </h3>

                        {loading ? (
                            <div className="text-center py-12 text-xs text-gray-400 font-bold">
                                Loading warehouse snapshots...
                            </div>
                        ) : snapshots.length === 0 ? (
                            <div className="text-center py-12 text-xs text-gray-400 font-bold">
                                No historical warehouse snapshots captured.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {snapshots.map(s => (
                                    <div key={s.id} className="py-4 flex justify-between items-center gap-4 text-xs">
                                        <div className="space-y-1">
                                            <div className="font-bold text-gray-900">Snapshot ID: {s.id.substring(0, 8)}</div>
                                            <div className="text-[10px] text-gray-400">
                                                Captured: {new Date(s.snapshot_date).toLocaleDateString()} | Type: {s.snapshot_type}
                                            </div>
                                        </div>

                                        <Link 
                                            to={`/app/assessment/analytics/accreditation`}
                                            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-250"
                                        >
                                            View Snapshot Report
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Operations tools */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-card rounded-3xl border border-border/40 p-6 shadow-premium-sm">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                            Accreditation Analytics
                        </h3>
                        <div className="space-y-3 text-xs">
                            <Link to="/app/assessment/analytics/question-analysis" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Item Difficulty & Quality statistics
                            </Link>
                            <Link to="/app/assessment/analytics/co-attainment" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Course Outcomes (CO) Attainment
                            </Link>
                            <Link to="/app/assessment/analytics/po-attainment" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Program Outcomes (PO) Attainment
                            </Link>
                            <Link to="/app/assessment/analytics/learning-gap" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                Learning Gaps & Remedials
                            </Link>
                            <Link to="/app/assessment/analytics/accreditation" className="block p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 font-bold">
                                NBA / NAAC compliance scorecard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AssessmentAnalyticsDashboard;
