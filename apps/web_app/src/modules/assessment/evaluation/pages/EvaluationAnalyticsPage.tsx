import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, BarChart3, TrendingUp, AlertCircle, HelpCircle } from 'lucide-react';
import { useEvaluationAnalytics } from '../hooks/useEvaluation';

export const EvaluationAnalyticsPage: React.FC = () => {
    const navigate = useNavigate();
    const { metrics, fetchMetrics, loading } = useEvaluationAnalytics();

    useEffect(() => {
        fetchMetrics();
    }, []);

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-5xl mx-auto">
            {/* Header banner */}
            <div className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
                <button onClick={() => navigate('/app/assessment/evaluation')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Evaluation Quality Analytics
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Accreditation dashboards for question difficulties, Bloom cognitive levels, and Course Outcomes.
                    </p>
                </div>
            </div>

            {/* Content stats view */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {/* Stats panel summary */}
                <div className="md:col-span-2 bg-white dark:bg-card rounded-3xl border border-border/40 p-6 shadow-premium-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-gray-150">
                        <BarChart3 className="w-4.5 h-4.5 text-primary" />
                        Accreditation Attainment Summary
                    </h3>

                    {loading ? (
                        <div className="text-center py-12 text-xs text-gray-400">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-4 text-xs">
                            <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                                <span className="font-bold text-gray-400">Bloom's Attainment Level</span>
                                <span className="font-black text-primary">88.50% Compliance</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                                <span className="font-bold text-gray-400">Course Outcomes (CO) Attainment</span>
                                <span className="font-black text-emerald-500">92.10% Target reached</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                                <span className="font-bold text-gray-400">Evaluator Turnaround Avg Time</span>
                                <span className="font-black text-gray-900">4.2 Hours / Attempt</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Performance Curve summary */}
                <div className="bg-gradient-to-br from-gray-950 to-slate-900 text-white rounded-3xl p-6 shadow-premium-xl space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 rounded-bl-full filter blur-xl"></div>
                    
                    <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-4.5 h-4.5 text-primary" />
                        Grading Normalizer Curve
                    </h3>

                    <p className="text-[10px] text-gray-400 leading-relaxed relative z-10">
                        Absolute grading scales mapped to CGPA system ranges with auto-grace logic thresholds.
                    </p>

                    <div className="pt-2 text-[10px] text-white/50 bg-white/5 p-3 rounded-2xl border border-white/5 relative z-10">
                        Standard deviation bounds are locked for the current term calculations.
                    </div>
                </div>
            </div>
        </div>
    );
};
export default EvaluationAnalyticsPage;
