import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, BarChart3, TrendingUp, AlertCircle, HelpCircle } from 'lucide-react';

export const ResultAnalyticsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 lg:space-y-8 p-6 max-w-5xl mx-auto">
            {/* Header banner */}
            <div className="flex items-center gap-4 bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 shadow-premium-sm">
                <button onClick={() => navigate('/app/assessment/results')} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wider">
                        Institutional Result Analytics
                    </h1>
                    <p className="text-[10px] text-gray-400">
                        Pass rates, standard deviations, and class performance curve maps.
                    </p>
                </div>
            </div>

            {/* Content grids stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                {/* Stats panel summary */}
                <div className="md:col-span-2 bg-white dark:bg-card rounded-3xl border border-border/40 p-6 shadow-premium-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 pb-3 border-b border-gray-150">
                        <BarChart3 className="w-4.5 h-4.5 text-primary" />
                        Accreditation Performance Indicators
                    </h3>

                    <div className="space-y-4 text-xs">
                        <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                            <span className="font-bold text-gray-400">Overall Pass Percentage</span>
                            <span className="font-black text-primary">95.00%</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                            <span className="font-bold text-gray-400">Mean GPA Score</span>
                            <span className="font-black text-primary">8.20 / 10.00</span>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                            <span className="font-bold text-gray-400">Standard Deviation Range</span>
                            <span className="font-black text-gray-900">1.10</span>
                        </div>
                    </div>
                </div>

                {/* Normalization Curve info card */}
                <div className="bg-gradient-to-br from-gray-950 to-slate-900 text-white rounded-3xl p-6 shadow-premium-xl space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-primary/10 rounded-bl-full filter blur-xl"></div>
                    
                    <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-4.5 h-4.5 text-primary" />
                        Distribution Curve
                    </h3>

                    <p className="text-[10px] text-gray-400 leading-relaxed relative z-10">
                        Grade distribution counts mapped onto standard Bell Curve ranges.
                    </p>

                    <div className="pt-2 text-[10px] text-white/50 bg-white/5 p-3 rounded-2xl border border-white/5 relative z-10">
                        Top Performers count: 5 Distinction ranks.
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ResultAnalyticsPage;
